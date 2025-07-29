'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Calendar, DollarSign, 
  FileText, Users, Building2, AlertCircle, 
  CheckCircle, Clock, PieChart, Activity
} from 'lucide-react';
import { Contract } from '@/types/contract';
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS } from '@/lib/utils/constants';

interface AnalyticsData {
  totalContracts: number;
  totalRevenue: number;
  averageContractValue: number;
  completionRate: number;
  averageCompletionTime: number;
  contractsByStatus: { [key: string]: number };
  contractsByType: { [key: string]: number };
  contractsByCompany: { company: string; count: number; revenue: number }[];
  monthlyData: { month: string; count: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '1m' | '3m' | '6m' | '1y'>('all');

  useEffect(() => {
    fetchContracts();
  }, [timeRange]);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      const data = await response.json();
      const contractList = data.data || [];
      setContracts(contractList);
      calculateAnalytics(contractList);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (contractList: Contract[]) => {
    // Filter by time range
    const now = new Date();
    const filteredContracts = contractList.filter(contract => {
      if (timeRange === 'all') return true;
      const contractDate = new Date(contract.createdAt);
      const monthsAgo = parseInt(timeRange.replace(/[^\d]/g, ''));
      const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
      return contractDate >= cutoffDate;
    });

    // Calculate basic stats
    const totalContracts = filteredContracts.length;
    const completedContracts = filteredContracts.filter(c => c.status === 'completed');
    const totalRevenue = completedContracts.reduce((sum, c) => sum + (c.transactionAmount || 0), 0);
    const averageContractValue = completedContracts.length > 0 ? totalRevenue / completedContracts.length : 0;
    const completionRate = totalContracts > 0 ? (completedContracts.length / totalContracts) * 100 : 0;

    // Calculate average completion time
    let totalCompletionTime = 0;
    let completionCount = 0;
    completedContracts.forEach(contract => {
      if (contract.completedAt) {
        const createdDate = new Date(contract.createdAt);
        const completedDate = new Date(contract.completedAt);
        const daysDiff = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        totalCompletionTime += daysDiff;
        completionCount++;
      }
    });
    const averageCompletionTime = completionCount > 0 ? totalCompletionTime / completionCount : 0;

    // Group by status
    const contractsByStatus: { [key: string]: number } = {};
    filteredContracts.forEach(contract => {
      contractsByStatus[contract.status] = (contractsByStatus[contract.status] || 0) + 1;
    });

    // Group by type
    const contractsByType: { [key: string]: number } = {};
    filteredContracts.forEach(contract => {
      if (contract.category) {
        contractsByType[contract.category] = (contractsByType[contract.category] || 0) + 1;
      }
    });

    // Group by company
    const companyMap: { [key: string]: { count: number; revenue: number } } = {};
    filteredContracts.forEach(contract => {
      const clientParty = contract.parties.find(p => p.type === 'client');
      const company = clientParty?.company || '未分類';
      if (!companyMap[company]) {
        companyMap[company] = { count: 0, revenue: 0 };
      }
      companyMap[company].count++;
      if (contract.status === 'completed' && contract.transactionAmount) {
        companyMap[company].revenue += contract.transactionAmount;
      }
    });
    const contractsByCompany = Object.entries(companyMap)
      .map(([company, data]) => ({ company, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10); // Top 10 companies

    // Monthly data for the last 12 months
    const monthlyData: { [key: string]: { count: number; revenue: number } } = {};
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last12Months.push(monthKey);
      monthlyData[monthKey] = { count: 0, revenue: 0 };
    }

    filteredContracts.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      const monthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].count++;
        if (contract.status === 'completed' && contract.transactionAmount) {
          monthlyData[monthKey].revenue += contract.transactionAmount;
        }
      }
    });

    const monthlyDataArray = last12Months.map(month => ({
      month: month.split('-')[1] + '月',
      count: monthlyData[month].count,
      revenue: monthlyData[month].revenue,
    }));

    setAnalytics({
      totalContracts,
      totalRevenue,
      averageContractValue,
      completionRate,
      averageCompletionTime,
      contractsByStatus,
      contractsByType,
      contractsByCompany,
      monthlyData: monthlyDataArray,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">分析データを読み込めませんでした</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          契約分析ダッシュボード
        </h1>
        <div className="flex gap-2">
          {(['all', '1m', '3m', '6m', '1y'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded ${
                timeRange === range 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'all' ? '全期間' : range.replace('m', 'ヶ月').replace('y', '年')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">総契約数</h3>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.totalContracts}</p>
          <p className="text-sm text-gray-500 mt-1">
            締結済み: {analytics.contractsByStatus['completed'] || 0}件
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">総売上</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ¥{analytics.totalRevenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            平均: ¥{Math.round(analytics.averageContractValue).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">締結率</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.completionRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">
            平均締結日数: {analytics.averageCompletionTime.toFixed(1)}日
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">進行中</h3>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(analytics.contractsByStatus['draft'] || 0) + 
             (analytics.contractsByStatus['pending_signature'] || 0) + 
             (analytics.contractsByStatus['pending_review'] || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            署名待ち: {analytics.contractsByStatus['pending_signature'] || 0}件
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            ステータス別分布
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.contractsByStatus).map(([status, count]) => {
              const percentage = (count / analytics.totalContracts) * 100;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] || status}</span>
                    <span>{count}件 ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'pending_signature' ? 'bg-yellow-500' :
                        status === 'draft' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            月別推移
          </h3>
          <div className="space-y-3">
            {analytics.monthlyData.map((data, index) => {
              const maxRevenue = Math.max(...analytics.monthlyData.map(d => d.revenue));
              const revenuePercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{data.month}</span>
                    <span>{data.count}件 / ¥{data.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${revenuePercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Companies */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          取引先別実績（上位10社）
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">会社名</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">契約数</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">売上</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">平均単価</th>
              </tr>
            </thead>
            <tbody>
              {analytics.contractsByCompany.map((company, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{company.company}</td>
                  <td className="text-right py-3 px-4">{company.count}件</td>
                  <td className="text-right py-3 px-4">¥{company.revenue.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">
                    ¥{company.count > 0 ? Math.round(company.revenue / company.count).toLocaleString() : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}