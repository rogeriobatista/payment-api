import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Delete,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TemporalService } from './temporal.service';
import { PaymentWorkflowInput } from './types/payment-workflow.types';

@ApiTags('Workflows')
@ApiBearerAuth('JWT-auth')
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly temporalService: TemporalService) {}

  @Post('payment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar workflow de pagamento',
    description: 'Inicia um novo workflow Temporal.io para processamento de pagamento',
  })
  @ApiBody({
    description: 'Dados para iniciar o workflow de pagamento',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        cpf: { type: 'string', example: '123.456.789-00' },
        description: { type: 'string', example: 'Pagamento de produto X' },
        amount: { type: 'number', example: 10000 },
        paymentMethod: { type: 'string', example: 'CREDIT_CARD' },
      },
      required: ['paymentId', 'cpf', 'description', 'amount', 'paymentMethod'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Workflow iniciado com sucesso',
    schema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string' },
        runId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos para o workflow',
  })
  @ApiResponse({
    status: 503,
    description: 'Temporal server indisponível',
  })
  async startPaymentWorkflow(@Body() input: PaymentWorkflowInput) {
    try {
      const handle = await this.temporalService.startPaymentWorkflow(input);
      
      return {
        workflowId: handle.workflowId,
        message: 'Payment workflow started successfully',
      };
    } catch (error) {
      if (error.message.includes('not initialized')) {
        throw new BadRequestException('Temporal service not available');
      }
      throw error;
    }
  }

  @Get('payment/:workflowId/status')
  @ApiOperation({
    summary: 'Obter status do workflow',
    description: 'Consulta o status atual de um workflow de pagamento',
  })
  @ApiParam({
    name: 'workflowId',
    description: 'ID do workflow',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do workflow retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'pending' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow não encontrado',
  })
  async getPaymentStatus(@Param('workflowId') workflowId: string) {
    try {
      const status = await this.temporalService.getPaymentStatus(workflowId);
      return { status };
    } catch (error) {
      throw new NotFoundException('Workflow not found');
    }
  }

  @Get('payment/:workflowId/progress')
  @ApiOperation({
    summary: 'Obter progresso do workflow',
    description: 'Consulta o progresso detalhado de um workflow de pagamento',
  })
  @ApiParam({
    name: 'workflowId',
    description: 'ID do workflow',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Progresso do workflow retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'processing' },
        step: { type: 'string', example: 'validation' },
        paymentId: { type: 'string' },
        externalId: { type: 'string', nullable: true },
        checkoutUrl: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow não encontrado',
  })
  async getWorkflowProgress(@Param('workflowId') workflowId: string) {
    try {
      return await this.temporalService.getWorkflowProgress(workflowId);
    } catch (error) {
      throw new NotFoundException('Workflow not found');
    }
  }

  @Delete('payment/:workflowId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar workflow de pagamento',
    description: 'Cancela um workflow de pagamento em execução',
  })
  @ApiParam({
    name: 'workflowId',
    description: 'ID do workflow',
    type: 'string',
  })
  @ApiBody({
    required: false,
    description: 'Motivo do cancelamento',
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'Cancelado pelo usuário' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow cancelado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Workflow cancelled successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow não encontrado',
  })
  async cancelPaymentWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() body?: { reason?: string }
  ) {
    try {
      const reason = body?.reason || 'Cancelled by user request';
      await this.temporalService.cancelPaymentWorkflow(workflowId, reason);
      
      return {
        message: 'Workflow cancelled successfully',
      };
    } catch (error) {
      throw new NotFoundException('Workflow not found');
    }
  }

  @Post('payment/:workflowId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar pagamento no workflow',
    description: 'Envia confirmação de pagamento para o workflow (usado por webhooks)',
  })
  @ApiParam({
    name: 'workflowId',
    description: 'ID do workflow',
    type: 'string',
  })
  @ApiBody({
    description: 'Dados de confirmação do pagamento',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'paid' },
        data: {
          type: 'object',
          description: 'Dados adicionais do provedor de pagamento',
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Pagamento confirmado no workflow',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Payment confirmed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow não encontrado',
  })
  async confirmPayment(
    @Param('workflowId') workflowId: string,
    @Body() body: { status: string; data?: any }
  ) {
    try {
      await this.temporalService.confirmPayment(
        workflowId, 
        body.status, 
        body.data || {}
      );
      
      return {
        message: 'Payment confirmed successfully',
      };
    } catch (error) {
      throw new NotFoundException('Workflow not found');
    }
  }

  @Get('payment/:paymentId/list')
  @ApiOperation({
    summary: 'Listar workflows de um pagamento',
    description: 'Lista todos os workflows relacionados a um pagamento específico',
  })
  @ApiParam({
    name: 'paymentId',
    description: 'ID do pagamento',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de workflows retornada com sucesso',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          workflowId: { type: 'string' },
          status: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          closeTime: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  })
  async listPaymentWorkflows(@Param('paymentId') paymentId: string) {
    try {
      return await this.temporalService.listPaymentWorkflows(paymentId);
    } catch (error) {
      throw new BadRequestException('Failed to list workflows');
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check do Temporal',
    description: 'Verifica se o serviço Temporal.io está disponível',
  })
  @ApiResponse({
    status: 200,
    description: 'Temporal server está saudável',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        temporal: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Temporal server indisponível',
  })
  async healthCheck() {
    const isHealthy = await this.temporalService.isHealthy();
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      temporal: isHealthy,
    };
  }
}