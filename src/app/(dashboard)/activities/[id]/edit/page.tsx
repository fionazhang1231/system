'use client';

import { useParams } from 'next/navigation';
import ActivityForm from '@/components/ActivityForm';

/** 编辑活动页面 */
export default function EditActivityPage() {
  const params = useParams();
  return <ActivityForm activityId={params.id as string} />;
}
