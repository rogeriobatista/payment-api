import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client, Connection, WorkflowHandle } from '@temporalio/client';
import { PaymentWorkflowInput, PaymentWorkflowResult } from './types/payment-workflow.types';

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name);
  private client: Client;
  private connection: Connection;

  async onModuleInit() {
    try {
      // Connect to Temporal Server
      this.connection = await Connection.connect({
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      });

      this.client = new Client({
        connection: this.connection,
        namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      });

      this.logger.log('Connected to Temporal server');
    } catch (error) {
      this.logger.error('Failed to connect to Temporal server:', error);
      // Don't throw here to allow the app to start even if Temporal is not available
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
      this.logger.log('Disconnected from Temporal server');
    }
  }

  // Start payment processing workflow
  async startPaymentWorkflow(input: PaymentWorkflowInput): Promise<WorkflowHandle> {
    if (!this.client) {
      throw new Error('Temporal client not initialized');
    }

    const workflowId = `payment-${input.paymentId}-${Date.now()}`;

    try {
      const handle = await this.client.workflow.start('paymentProcessingWorkflow', {
        workflowId,
        taskQueue: 'payment-processing',
        args: [input],
        workflowExecutionTimeout: '1 hour',
        workflowRunTimeout: '1 hour',
        workflowTaskTimeout: '10 seconds',
      });

      this.logger.log(`Started payment workflow: ${workflowId}`, { paymentId: input.paymentId });
      return handle;
    } catch (error) {
      this.logger.error('Failed to start payment workflow:', error);
      throw error;
    }
  }

  // Get workflow handle by ID
  async getWorkflowHandle(workflowId: string): Promise<WorkflowHandle> {
    if (!this.client) {
      throw new Error('Temporal client not initialized');
    }

    return this.client.workflow.getHandle(workflowId);
  }

  // Cancel payment workflow
  async cancelPaymentWorkflow(workflowId: string, reason: string = 'User cancellation'): Promise<void> {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      await handle.signal('cancelPayment', reason);
      this.logger.log(`Cancelled payment workflow: ${workflowId}`, { reason });
    } catch (error) {
      this.logger.error('Failed to cancel payment workflow:', error);
      throw error;
    }
  }

  // Confirm payment (webhook callback)
  async confirmPayment(workflowId: string, status: string, data: any): Promise<void> {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      await handle.signal('confirmPayment', status, data);
      this.logger.log(`Confirmed payment workflow: ${workflowId}`, { status });
    } catch (error) {
      this.logger.error('Failed to confirm payment workflow:', error);
      throw error;
    }
  }

  // Query workflow status
  async getPaymentStatus(workflowId: string): Promise<string> {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      return await handle.query('getPaymentStatus');
    } catch (error) {
      this.logger.error('Failed to query payment status:', error);
      throw error;
    }
  }

  // Query workflow progress
  async getWorkflowProgress(workflowId: string): Promise<any> {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      return await handle.query('getWorkflowProgress');
    } catch (error) {
      this.logger.error('Failed to query workflow progress:', error);
      throw error;
    }
  }

  // Wait for workflow completion
  async waitForWorkflowCompletion(workflowId: string): Promise<PaymentWorkflowResult> {
    try {
      const handle = await this.getWorkflowHandle(workflowId);
      return await handle.result();
    } catch (error) {
      this.logger.error('Error waiting for workflow completion:', error);
      throw error;
    }
  }

  // List running workflows for a payment
  async listPaymentWorkflows(paymentId: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Temporal client not initialized');
    }

    try {
      const workflows = await this.client.workflow.list({
        query: `WorkflowId STARTS_WITH "payment-${paymentId}"`,
      });

      const workflowList = [];
      for await (const workflow of workflows) {
        workflowList.push({
          workflowId: workflow.workflowId,
          status: workflow.status,
          startTime: workflow.startTime,
          closeTime: workflow.closeTime,
        });
      }

      return workflowList;
    } catch (error) {
      this.logger.error('Failed to list payment workflows:', error);
      throw error;
    }
  }

  // Health check for Temporal connection
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      // Try to list workflows to test connection
      const workflows = await this.client.workflow.list({
        query: 'WorkflowId = "health-check-test"',
      });
      
      // Just iterating once to test the connection
      for await (const _ of workflows) {
        break;
      }

      return true;
    } catch (error) {
      this.logger.warn('Temporal health check failed:', error);
      return false;
    }
  }
}