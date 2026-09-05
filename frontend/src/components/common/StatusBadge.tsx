import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const label = status ? status.replace(/_/g, ' ') : '';
  switch (status) {
    case 'CONFIRMED':
    case 'SUCCESS':
    case 'PAID':
    case 'COMPLETED':
    case 'CUSTOMER_ACCEPTED':
    case 'IN_STOCK':
      return <Badge variant='green'>{label}</Badge>;

    case 'IN_PRODUCTION':
    case 'FABRICATION':
    case 'ASSEMBLY':
    case 'CUTTING':
    case 'MATERIAL_PREP':
    case 'READY_FOR_DELIVERY':
    case 'UNDER_REVIEW':
    case 'PRICE_PROPOSED':
    case 'MADE_TO_ORDER':
      return <Badge variant='blue'>{label}</Badge>;

    case 'PENDING':
    case 'PAYMENT_PENDING':
    case 'PARTIALLY_PAID':
    case 'SUBMITTED':
    case 'ISSUED':
      return <Badge variant='yellow'>{label}</Badge>;

    case 'CANCELLED':
    case 'CUSTOMER_REJECTED':
    case 'FAILED':
    case 'EXPIRED':
    case 'OUT_OF_STOCK':
      return <Badge variant='red'>{label}</Badge>;

    default:
      return <Badge variant='gray'>{label}</Badge>;
  }
};
