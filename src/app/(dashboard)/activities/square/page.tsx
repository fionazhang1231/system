'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Input, Select, Button, Tag, Space, Drawer, Modal, Message, Spin, Empty, Radio,
} from '@arco-design/web-react';
import { IconSearch, IconRefresh, IconLock, IconEye, IconThunderbolt } from '@arco-design/web-react/icon';
import BreadcrumbNav from '@/components/layout/Breadcrumb';
import { apiGet } from '@/lib/api';
import {
  ActivityTemplate, TEMPLATE_CATEGORIES, TEMPLATE_INDUSTRIES,
} from '@/lib/activity-templates';
import H5PhonePreview from '@/components/H5PhonePreview';

/** 价格类型标签 */
const priceTypeTag = (tpl: ActivityTemplate) => {
  if (tpl.priceType === 'free') return <Tag color="green">免费</Tag>;
  if (tpl.priceType === 'paid') return <Tag color="gold">付费 HKD {tpl.price}</Tag>;
  return <Tag color="purple" icon={<IconLock />}>企业版专属</Tag>;
};

/** 活动广场 - 内置 H5 报名模板库 */
export default function ActivitySquarePage() {
  const router = useRouter();
  const [data, setData] = useState<ActivityTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // 筛选条件
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [industry, setIndustry] = useState('');
  const [priceType, setPriceType] = useState('');

  // 预览抽屉
  const [previewTpl, setPreviewTpl] = useState<ActivityTemplate | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<ActivityTemplate[]>('/activity-templates', {
        keyword: keyword || undefined,
        category: category || undefined,
        industry: industry || undefined,
        priceType: priceType || undefined,
      });
      if (res.success && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, industry, priceType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReset = () => {
    setKeyword(''); setCategory(''); setIndustry(''); setPriceType('');
  };

  /** 使用模板 */
  const handleUse = (tpl: ActivityTemplate) => {
    if (tpl.priceType === 'free') {
      router.push(`/activities/create?template=${tpl.id}`);
      return;
    }
    // 付费 / 企业版模板：升级引导
    Modal.confirm({
      title: '升级后可用',
      content: (
        <div style={{ lineHeight: 1.8 }}>
          模板「{tpl.name}」为
          {tpl.priceType === 'paid' ? `付费模板（HKD ${tpl.price}）` : '企业高级版专属模板'}
          。升级企业高级版本后，即可解锁全部付费模板与专属模板，并享有专属客服与数据导出等高级能力。
        </div>
      ),
      okText: '了解企业高级版',
      cancelText: '暂不升级',
      onOk: () => { Message.info('Demo 环境暂未开通升级流程，请联系商务咨询'); },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <BreadcrumbNav items={[{ title: '活动管理' }, { title: '活动广场' }]} />

      {/* 筛选区 */}
      <div className="site-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="搜索模板名称 / 描述"
            prefix={<IconSearch />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            allowClear
          />
          <Select
            placeholder="活动分类"
            style={{ width: 140 }}
            value={category || undefined}
            onChange={(v) => setCategory(v || '')}
            allowClear
            options={TEMPLATE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Select
            placeholder="所属行业"
            style={{ width: 150 }}
            value={industry || undefined}
            onChange={(v) => setIndustry(v || '')}
            allowClear
            options={TEMPLATE_INDUSTRIES.map((i) => ({ value: i, label: i }))}
          />
          <Radio.Group
            type="button"
            value={priceType}
            onChange={setPriceType}
            options={[
              { value: '', label: '全部' },
              { value: 'free', label: '免费' },
              { value: 'paid', label: '付费' },
              { value: 'enterprise', label: '企业版专属' },
            ]}
          />
          <Button icon={<IconRefresh />} onClick={handleReset}>重置</Button>
        </div>
      </div>

      {/* 模板网格 */}
      <Spin loading={loading} style={{ display: 'block' }}>
        {data.length === 0 && !loading ? (
          <div className="site-card" style={{ padding: 60 }}>
            <Empty description="没有符合条件的模板，试试调整筛选条件" />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {data.map((tpl) => (
              <div
                key={tpl.id}
                className="site-card"
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* 封面 */}
                <div
                  style={{
                    height: 110,
                    background: tpl.gradient,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 44 }}>{tpl.emoji}</span>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>{priceTypeTag(tpl)}</div>
                  <div
                    style={{
                      position: 'absolute', bottom: 8, left: 12,
                      color: '#fff', fontWeight: 600, fontSize: 14,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    }}
                  >
                    {tpl.name}
                  </div>
                </div>
                {/* 内容 */}
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontSize: 12, color: '#86909C', lineHeight: 1.6, height: 38,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {tpl.desc}
                  </div>
                  <Space size={4} style={{ margin: '8px 0' }}>
                    <Tag size="small" color="arcoblue">{tpl.category}</Tag>
                    <Tag size="small" bordered>{tpl.industry}</Tag>
                  </Space>
                  <div style={{ fontSize: 12, color: '#86909C', marginBottom: 12 }}>
                    {tpl.uses.toLocaleString()} 次使用
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      icon={<IconEye />}
                      style={{ flex: 1 }}
                      onClick={() => setPreviewTpl(tpl)}
                    >
                      预览
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      icon={tpl.priceType === 'free' ? <IconThunderbolt /> : <IconLock />}
                      style={{ flex: 1 }}
                      onClick={() => handleUse(tpl)}
                    >
                      {tpl.priceType === 'free' ? '使用模板' : '解锁使用'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>

      {/* 模板预览抽屉 */}
      <Drawer
        title={previewTpl ? `模板预览：${previewTpl.name}` : ''}
        visible={!!previewTpl}
        onCancel={() => setPreviewTpl(null)}
        width={420}
        footer={
          previewTpl && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setPreviewTpl(null)}>关闭</Button>
              <Button type="primary" onClick={() => { handleUse(previewTpl); }}>
                {previewTpl.priceType === 'free' ? '使用模板' : '解锁使用'}
              </Button>
            </div>
          )
        }
      >
        {previewTpl && (
          <div>
            <div style={{ marginBottom: 16, lineHeight: 1.8, color: '#4E5969', fontSize: 13 }}>
              {previewTpl.desc}
            </div>
            <H5PhonePreview
              config={previewTpl.h5Config}
              activity={{
                title: previewTpl.prefill.title,
                timeText: '2025-12-20 14:00 ~ 2025-12-20 17:00',
                location: '澳门万豪酒店宴会厅',
                feeText: '免费',
                description: previewTpl.prefill.description,
              }}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
