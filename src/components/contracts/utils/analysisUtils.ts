export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-green-50 text-green-700 border-green-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function getImpactLevelColor(level: 'high' | 'medium' | 'low'): {
  containerClass: string;
  badgeClass: string;
  label: string;
} {
  switch (level) {
    case 'high':
      return {
        containerClass: 'border-red-200 bg-red-50',
        badgeClass: 'bg-red-100 text-red-800',
        label: '高'
      };
    case 'medium':
      return {
        containerClass: 'border-yellow-200 bg-yellow-50',
        badgeClass: 'bg-yellow-100 text-yellow-800',
        label: '中'
      };
    case 'low':
      return {
        containerClass: 'border-blue-200 bg-blue-50',
        badgeClass: 'bg-blue-100 text-blue-800',
        label: '低'
      };
  }
}