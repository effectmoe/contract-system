import { getDatabaseService } from '@/lib/db/mongodb';
import { AuditEntry } from '@/types/contract';

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export class AuditService {
  /**
   * Log an audit entry
   */
  async log(entry: {
    action: string;
    resource: string;
    resourceId: string;
    performedBy: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const auditService = await getDatabaseService<AuditLog>('audit_logs');
      
      await auditService.create({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        performedBy: entry.performedBy,
        performedAt: new Date(),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        details: entry.details || {},
        success: entry.success ?? true,
        errorMessage: entry.errorMessage,
      });
    } catch (error) {
      // Don't throw - audit logging should not break the main flow
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log contract action
   */
  async logContractAction(
    action: AuditEntry['action'],
    contractId: string,
    userId: string,
    details?: Record<string, any>,
    request?: Request
  ): Promise<void> {
    await this.log({
      action,
      resource: 'contract',
      resourceId: contractId,
      performedBy: userId,
      ipAddress: request?.headers.get('x-forwarded-for') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
      details,
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    action: 'login' | 'logout' | 'register' | 'password_reset',
    userId: string,
    success: boolean,
    ipAddress?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'auth',
      resourceId: userId,
      performedBy: userId,
      ipAddress,
      success,
      errorMessage,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'security',
      resourceId: 'system',
      performedBy: 'system',
      ipAddress,
      details,
      success: false,
    });
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceLogs(
    resource: string,
    resourceId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditLog[]> {
    const auditService = await getDatabaseService<AuditLog>('audit_logs');
    
    const filter: any = {
      resource,
      resourceId,
    };

    if (options?.startDate || options?.endDate) {
      filter.performedAt = {};
      if (options.startDate) {
        filter.performedAt.$gte = options.startDate;
      }
      if (options.endDate) {
        filter.performedAt.$lte = options.endDate;
      }
    }

    const result = await auditService.findMany(filter, {
      limit: options?.limit || 100,
      sort: { performedAt: -1 },
    });

    return result.data;
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(
    userId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditLog[]> {
    const auditService = await getDatabaseService<AuditLog>('audit_logs');
    
    const filter: any = {
      performedBy: userId,
    };

    if (options?.startDate || options?.endDate) {
      filter.performedAt = {};
      if (options.startDate) {
        filter.performedAt.$gte = options.startDate;
      }
      if (options.endDate) {
        filter.performedAt.$lte = options.endDate;
      }
    }

    const result = await auditService.findMany(filter, {
      limit: options?.limit || 100,
      sort: { performedAt: -1 },
    });

    return result.data;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByResource: Record<string, number>;
    failedActions: number;
    uniqueUsers: number;
  }> {
    const auditService = await getDatabaseService<AuditLog>('audit_logs');
    
    const pipeline = [
      {
        $match: {
          performedAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $facet: {
          totalActions: [{ $count: 'count' }],
          actionsByType: [
            { $group: { _id: '$action', count: { $sum: 1 } } },
          ],
          actionsByResource: [
            { $group: { _id: '$resource', count: { $sum: 1 } } },
          ],
          failedActions: [
            { $match: { success: false } },
            { $count: 'count' },
          ],
          uniqueUsers: [
            { $group: { _id: '$performedBy' } },
            { $count: 'count' },
          ],
        },
      },
    ];

    const results = await auditService.aggregate(pipeline);
    const data = results[0];

    return {
      totalActions: data.totalActions[0]?.count || 0,
      actionsByType: Object.fromEntries(
        data.actionsByType.map((item: any) => [item._id, item.count])
      ),
      actionsByResource: Object.fromEntries(
        data.actionsByResource.map((item: any) => [item._id, item.count])
      ),
      failedActions: data.failedActions[0]?.count || 0,
      uniqueUsers: data.uniqueUsers[0]?.count || 0,
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();