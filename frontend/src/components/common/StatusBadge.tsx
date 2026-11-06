import React from 'react';
import { Badge } from './Badge';
import { useLanguageStore } from '../../store/languageStore';

interface StatusBadgeProps {
  status: string;
}

const STATUS_AMHARIC: Record<string, string> = {
  'CONFIRMED': 'የተረጋገጠ',
  'SUCCESS': 'የተሳካ',
  'COMPLETED': 'የተጠናቀቀ',
  'CUSTOMER_ACCEPTED': 'በደንበኛ የጸደቀ',
  'IN_STOCK': 'ያለ',
  'IN_PRODUCTION': 'በማምረት ላይ',
  'FABRICATION': 'በመገጣጠም ላይ',
  'ASSEMBLY': 'በማገጣጠም ላይ',
  'CUTTING': 'በመቁረጥ ላይ',
  'MATERIAL_PREP': 'ጥሬ እቃ ዝግጅት',
  'READY': 'ዝግጁ',
  'READY_FOR_DELIVERY': 'ለመረከብ የተዘጋጀ',
  'DELIVERY': 'በማድረስ ላይ',
  'INSTALLATION': 'በመግጠም ላይ',
  'UNDER_REVIEW': 'በግምገማ ላይ',
  'PRICE_PROPOSED': 'ዋጋ የቀረበለት',
  'MADE_TO_ORDER': 'በትዕዛዝ የሚሰራ',
  'PENDING': 'በመጠባበቅ ላይ',
  'SUBMITTED': 'የገባ',
  'CANCELLED': 'የተሰረዘ',
  'CUSTOMER_REJECTED': 'በደንበኛ ውድቅ የተደረገ',
  'FAILED': 'ያልተሳካ',
  'EXPIRED': 'ጊዜው ያለፈበት',
  'OUT_OF_STOCK': 'ያለቀ',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { language } = useLanguageStore();
  const normalized = (status || '').toUpperCase().trim();
  const label = language === 'am' && STATUS_AMHARIC[normalized]
    ? STATUS_AMHARIC[normalized]
    : status ? status.replace(/_/g, ' ') : '';

  switch (normalized) {
    case 'CONFIRMED':
    case 'SUCCESS':
    case 'COMPLETED':
    case 'CUSTOMER_ACCEPTED':
    case 'IN_STOCK':
      return <Badge variant='green'>{label}</Badge>;

    case 'IN_PRODUCTION':
    case 'FABRICATION':
    case 'ASSEMBLY':
    case 'CUTTING':
    case 'MATERIAL_PREP':
    case 'READY':
    case 'READY_FOR_DELIVERY':
    case 'DELIVERY':
    case 'INSTALLATION':
    case 'UNDER_REVIEW':
    case 'PRICE_PROPOSED':
    case 'MADE_TO_ORDER':
      return <Badge variant='blue'>{label}</Badge>;

    case 'PENDING':
    case 'SUBMITTED':
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
