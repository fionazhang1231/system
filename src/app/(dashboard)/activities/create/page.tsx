'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Spin } from '@arco-design/web-react';
import ActivityForm from '@/components/ActivityForm';

/** 读取模板参数（从活动广场"使用模板"进入时预填） */
function CreateActivityInner() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template') || undefined;
  return <ActivityForm templateId={templateId} />;
}

/** 创建活动页面 */
export default function CreateActivityPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, display: 'flex', justifyContent: 'center', paddingTop: 100 }}>
          <Spin size={40} />
        </div>
      }
    >
      <CreateActivityInner />
    </Suspense>
  );
}
