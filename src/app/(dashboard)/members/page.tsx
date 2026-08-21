'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, Button, Input, Select, Message, Modal, Space, Tag, Avatar,
  Dropdown, Menu, Upload, Drawer, Checkbox, Tooltip,
} from '@arco-design/web-react';
import {
  IconSearch, IconPlus, IconDownload, IconDelete, IconEdit, IconEye,
  IconUser, IconUpload, IconDown, IconRefresh, IconFile, IconSettings,
} from '@arco-design/web-react/icon';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import { apiGet, apiDelete } from '@/lib/api';
import dayjs from 'dayjs';

/** 会员列表项类型 */
interface MemberItem {
  id: number;
  name: string;
  phone: string;
  phone_region: string;
  avatar_url: string | null;
  email: string | null;
  gender: number;
  identity_status: string;
  member_no: string | null;
  memberType: { id: number; name: string } | null;
  memberLevel: { id: number; name: string } | null;
  member_type: string | null;
  member_level: string | null;
  membership_status: string | null;
  growth_value: number | null;
  rfm_layer: string | null;
  join_date: string | null;
  expire_date: string | null;
  created_at: string;
}

/** 会员类型/等级选项 */
interface TypeOption { id: number; name: string }
interface LevelOption { id: number; name: string }

/** 会籍状态映射 */
const MEMBERSHIP_STATUS: Record<string, { text: string; color: string }> = {
  active: { text: '正常', color: 'green' },
  expired: { text: '已过期', color: 'orange' },
  revoked: { text: '已撤销', color: 'red' },
};

/** RFM 分层映射 */
const RFM_LAYER: Record<string, { text: string; color: string }> = {
  high_value: { text: '高价值', color: 'red' },
  potential: { text: '潜力', color: 'blue' },
  stable: { text: '稳定', color: 'green' },
  sleeping: { text: '沉睡', color: 'gray' },
  new: { text: '新会员', color: 'purple' },
};

const GENDER_MAP: Record<number, string> = { 0: '未知', 1: '男', 2: '女' };

/** 可配置列定义（key 对应 dataIndex） */
const ALL_COLUMNS = [
  { key: 'member_no', title: '会员编号', defaultVisible: true },
  { key: 'name', title: '姓名', defaultVisible: true },
  { key: 'phone', title: '手机号', defaultVisible: true },
  { key: 'email', title: '邮箱', defaultVisible: false },
  { key: 'gender', title: '性别', defaultVisible: false },
  { key: 'memberType', title: '会员类型', defaultVisible: true },
  { key: 'memberLevel', title: '会员等级', defaultVisible: true },
  { key: 'growth_value', title: '成长值', defaultVisible: true },
  { key: 'rfm_layer', title: 'RFM分层', defaultVisible: true },
  { key: 'membership_status', title: '会籍状态', defaultVisible: true },
  { key: 'join_date', title: '入会日期', defaultVisible: false },
  { key: 'expire_date', title: '到期日期', defaultVisible: false },
  { key: 'created_at', title: '注册时间', defaultVisible: true },
];

/** 会员列表页 */
export default function MembersPage() {
  const router = useRouter();
  const [data, setData] = useState<MemberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 搜索条件
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 筛选选项
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);

  // 跨页多选（rowKey 为 number 类型 id，selectedKeys 必须用 number 匹配）
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [importVisible, setImportVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  // 列表配置
  const [configVisible, setConfigVisible] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
  );

  const selectedKeysRef = useRef(selectedKeys);
  selectedKeysRef.current = selectedKeys;

  // 加载筛选选项
  useEffect(() => {
    apiGet<TypeOption[]>('/member-types').then((res) => {
      if (res.success && res.data) setTypes(res.data);
    });
    apiGet<LevelOption[]>('/member-levels').then((res) => {
      if (res.success && res.data) setLevels(res.data);
    });
  }, []);

  // 加载会员列表
  const fetchData = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('pageSize', String(ps));
      if (keyword) params.set('keyword', keyword);
      if (typeFilter) params.set('member_type', typeFilter);
      if (levelFilter) params.set('member_level', levelFilter);
      if (statusFilter) params.set('membership_status', statusFilter);
      const res = await apiGet<MemberItem[]>(`/members?${params.toString()}`);
      if (res.success && res.data) {
        setData(res.data);
        setTotal(res.total || 0);
      } else {
        Message.error('获取会员列表失败');
      }
    } catch {
      Message.error('获取会员列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, typeFilter, levelFilter, statusFilter]);

  useEffect(() => {
    fetchData(page, pageSize);
  }, [page, pageSize, fetchData]);

  const handleSearch = () => { setPage(1); fetchData(1, pageSize); };
  const handleReset = () => {
    setKeyword(''); setTypeFilter(''); setLevelFilter(''); setStatusFilter('');
    setPage(1); fetchData(1, pageSize);
  };

  // 删除会员
  const handleDelete = (record: MemberItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员「${record.name}」（${record.member_no || ''}）吗？`,
      okText: '删除',
      okButtonProps: { status: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        const res = await apiDelete(`/members/${record.id}`);
        if (res.success) { Message.success('删除成功'); fetchData(page, pageSize); }
        else { Message.error('删除失败'); }
      },
    });
  };

  // 批量删除已选
  const handleBatchDeleteSelected = () => {
    if (selectedKeys.length === 0) { Message.warning('请先选择要删除的会员'); return; }
    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除已选中的 ${selectedKeys.length} 条会员记录吗？`,
      okText: '确认删除',
      okButtonProps: { status: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        const results = await Promise.all(selectedKeys.map((id) => apiDelete(`/members/${id}`)));
        const failCount = results.filter((r) => !r.success).length;
        if (failCount === 0) { Message.success(`成功删除 ${selectedKeys.length} 条会员记录`); }
        else { Message.warning(`删除完成：${selectedKeys.length - failCount} 条成功，${failCount} 条失败`); }
        setSelectedKeys([]); fetchData(1, pageSize);
      },
    });
  };

  // 删除全部
  const handleDeleteAll = () => {
    Modal.confirm({
      title: '危险操作',
      content: `确定要删除全部 ${total} 条会员记录吗？此操作不可恢复！`,
      okText: '确认全部删除',
      okButtonProps: { status: 'danger' },
      cancelText: '取消',
      onOk: async () => {
        const allIds = data.map((d) => d.id);
        let deleted = 0; let failed = 0;
        Message.loading({ content: '正在批量删除...', duration: 0, id: 'batch-del' });
        for (let i = 0; i < allIds.length; i += 50) {
          const batch = allIds.slice(i, i + 50);
          const results = await Promise.all(batch.map((id) => apiDelete(`/members/${id}`)));
          deleted += results.filter((r) => r.success).length;
          failed += results.filter((r) => !r.success).length;
        }
        Message.clear();
        if (failed === 0) { Message.success(`成功删除全部 ${deleted} 条会员记录`); }
        else { Message.warning(`删除完成：${deleted} 条成功，${failed} 条失败`); }
        setSelectedKeys([]); fetchData(1, pageSize);
      },
    });
  };

  // 导出（统一走列表 API，避免详情 API 嵌套结构导致字段为空）
  const handleExportSelected = async () => {
    if (selectedKeys.length === 0) { Message.warning('请先选择要导出的会员'); return; }
    Message.loading({ content: '正在导出...', duration: 0, id: 'export-sel' });
    try {
      // 从列表 API 拉取全部数据，再按选中 ID 过滤
      const allData: MemberItem[] = [];
      let currentPage = 1; let hasMore = true;
      while (hasMore) {
        const params = new URLSearchParams();
        params.set('page', String(currentPage)); params.set('pageSize', '200');
        const res = await apiGet<MemberItem[]>(`/members?${params.toString()}`);
        if (res.success && res.data && res.data.length > 0) {
          allData.push(...res.data); hasMore = res.data.length === 200; currentPage++;
        } else { hasMore = false; }
      }
      const selected = allData.filter((m) => selectedKeys.includes(m.id));
      exportCSVData(selected); Message.clear();
      Message.success(`成功导出 ${selected.length} 条会员数据`);
    } catch { Message.clear(); Message.error('导出失败'); }
  };
  const handleExportAll = async () => {
    Message.loading({ content: '正在导出全部数据...', duration: 0, id: 'export-all' });
    try {
      const allData: MemberItem[] = [];
      let currentPage = 1; let hasMore = true;
      while (hasMore) {
        const params = new URLSearchParams();
        params.set('page', String(currentPage)); params.set('pageSize', '200');
        const res = await apiGet<MemberItem[]>(`/members?${params.toString()}`);
        if (res.success && res.data && res.data.length > 0) {
          allData.push(...res.data); hasMore = res.data.length === 200; currentPage++;
        } else { hasMore = false; }
      }
      exportCSVData(allData); Message.clear();
      Message.success(`成功导出 ${allData.length} 条会员数据`);
    } catch { Message.clear(); Message.error('导出失败'); }
  };
  const exportCSVData = (members: MemberItem[]) => {
    // CSV 字段加引号包裹，防止 Excel 将手机号等自动转为科学计数法
    const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const headers = ['会员编号', '姓名', '手机号', '邮箱', '性别', '会员类型', '会员等级', '会籍状态', '成长值', 'RFM分层', '入会日期', '到期日期'];
    const rows = members.map((m) => [
      escapeCSV(m.member_no || ''),
      escapeCSV(m.name),
      escapeCSV(`${m.phone_region}${m.phone}`),
      escapeCSV(m.email || ''),
      escapeCSV(GENDER_MAP[m.gender] || '未知'),
      escapeCSV(m.memberType?.name || ''),
      escapeCSV(m.memberLevel?.name || ''),
      escapeCSV(MEMBERSHIP_STATUS[m.membership_status || '']?.text || ''),
      escapeCSV(String(m.growth_value || 0)),
      escapeCSV(RFM_LAYER[m.rfm_layer || '']?.text || ''),
      escapeCSV(m.join_date ? dayjs(m.join_date).format('YYYY-MM-DD') : ''),
      escapeCSV(m.expire_date ? dayjs(m.expire_date).format('YYYY-MM-DD') : ''),
    ]);
    const csvContent = [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `会员数据_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    link.click(); URL.revokeObjectURL(url);
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    const headers = ['姓名', '手机号', '手机号区号', '邮箱', '性别', '生日', '地址', '会员类型', '会员等级', '备注'];
    const example = ['张三', '13800138000', '+86', 'zhangsan@example.com', '男', '1990-01-01', '香港九龙', '普通会员', 'VIP1', '示例备注'];
    const csvContent = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = '会员导入模板.csv'; link.click(); URL.revokeObjectURL(url);
    Message.success('模板下载成功');
  };

  // 批量导入
  const handleImport = async () => {
    setImportLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setImportLoading(false); setImportVisible(false);
    Message.success('导入完成（Demo 中为模拟导入）');
  };

  // 构建所有可用列
  const buildColumns = (): ColumnProps<MemberItem>[] => {
    const allColDefs: Record<string, ColumnProps<MemberItem>> = {
      member_no: {
        title: '会员编号', dataIndex: 'member_no', width: 110,
        render: (v: string | null) => v || '-',
      },
      name: {
        title: '姓名', dataIndex: 'name', width: 140,
        render: (v: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={28} style={{ backgroundColor: '#1677FF' }}><IconUser /></Avatar>
            <span>{v}</span>
          </div>
        ),
      },
      phone: {
        title: '手机号', dataIndex: 'phone', width: 150,
        render: (v: string, record: MemberItem) => `${record.phone_region}${v}`,
      },
      email: {
        title: '邮箱', dataIndex: 'email', width: 180,
        render: (v: string | null) => v || '-',
      },
      gender: {
        title: '性别', dataIndex: 'gender', width: 70, align: 'center',
        render: (v: number) => GENDER_MAP[v] || '未知',
      },
      memberType: {
        title: '会员类型', dataIndex: 'memberType', width: 110,
        render: (v: { id: number; name: string } | null) => (
          <Tag color={v ? 'arcoblue' : 'gray'}>{v?.name || '-'}</Tag>
        ),
      },
      memberLevel: {
        title: '会员等级', dataIndex: 'memberLevel', width: 100,
        render: (v: { id: number; name: string } | null) => (
          <Tag color={v ? 'gold' : 'gray'}>{v?.name || '-'}</Tag>
        ),
      },
      growth_value: {
        title: '成长值', dataIndex: 'growth_value', width: 100, align: 'right',
        render: (v: number | null) => (v ?? 0).toLocaleString(),
      },
      rfm_layer: {
        title: 'RFM分层', dataIndex: 'rfm_layer', width: 100,
        render: (v: string | null) => {
          const info = RFM_LAYER[v || ''];
          return info ? <Tag color={info.color}>{info.text}</Tag> : '-';
        },
      },
      membership_status: {
        title: '会籍状态', dataIndex: 'membership_status', width: 100,
        render: (v: string | null) => {
          const info = MEMBERSHIP_STATUS[v || ''];
          return info ? <Tag color={info.color}>{info.text}</Tag> : '-';
        },
      },
      join_date: {
        title: '入会日期', dataIndex: 'join_date', width: 110,
        render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
      },
      expire_date: {
        title: '到期日期', dataIndex: 'expire_date', width: 110,
        render: (v: string | null) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
      },
      created_at: {
        title: '注册时间', dataIndex: 'created_at', width: 110,
        sorter: (a: MemberItem, b: MemberItem) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
      },
    };

    // 按配置过滤列
    const cols = visibleColumns
      .filter((key) => allColDefs[key])
      .map((key) => allColDefs[key]);

    // 追加操作列（固定右侧）
    cols.push({
      title: '操作',
      dataIndex: 'operations',
      width: 160,
      align: 'center',
      fixed: 'right',
      render: (_: unknown, record: MemberItem) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<IconEye />} onClick={() => router.push(`/members/${record.id}`)}>
            详情
          </Button>
          <Button type="text" size="small" icon={<IconEdit />} onClick={() => router.push(`/members/${record.id}/edit`)}>
            编辑
          </Button>
          <Button type="text" size="small" status="danger" icon={<IconDelete />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    });

    return cols;
  };

  // 表格行选择（跨页多选，keys 保持 number 类型与 rowKey 一致）
  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (keys: (string | number)[]) => {
      const currentPageIds = data.map((d) => d.id);
      const currentSelected = keys.map(Number);
      const otherPageSelected = selectedKeysRef.current.filter(
        (k) => !currentPageIds.includes(k)
      );
      setSelectedKeys([...otherPageSelected, ...currentSelected]);
    },
    checkAll: true,
    checkCrossPage: true,
    preserveSelectedRowKeys: true,
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 搜索筛选区 */}
      <div className="site-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Input
            placeholder="姓名 / 手机号 / 会员编号"
            prefix={<IconSearch />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(v) => setKeyword(v)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select
            placeholder="请选择会员类型"
            style={{ width: 150 }}
            value={typeFilter || undefined}
            onChange={(v) => setTypeFilter(v || '')}
            allowClear
            options={types.map((t) => ({ value: String(t.id), label: t.name }))}
          />
          <Select
            placeholder="请选择会员等级"
            style={{ width: 140 }}
            value={levelFilter || undefined}
            onChange={(v) => setLevelFilter(v || '')}
            allowClear
            options={levels.map((l) => ({ value: String(l.id), label: l.name }))}
          />
          <Select
            placeholder="请选择会员状态"
            style={{ width: 150 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v || '')}
            allowClear
            options={[
              { value: 'active', label: '正常' },
              { value: 'expired', label: '已过期' },
              { value: 'revoked', label: '已撤销' },
            ]}
          />
          <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>搜索</Button>
          <Button icon={<IconRefresh />} onClick={handleReset}>重置</Button>
        </div>
      </div>

      {/* 操作按钮区 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => router.push('/members/create')}>
            新增会员
          </Button>
          <Button icon={<IconUpload />} onClick={() => setImportVisible(true)}>
            批量导入
          </Button>
          <Dropdown
            droplist={
              <Menu>
                <Menu.Item key="selected" onClick={handleExportSelected}>
                  导出已选 ({selectedKeys.length} 条)
                </Menu.Item>
                <Menu.Item key="all" onClick={handleExportAll}>
                  导出全部 ({total} 条)
                </Menu.Item>
              </Menu>
            }
            trigger="click" position="bl"
          >
            <Button icon={<IconDownload />}>
              批量导出 <IconDown style={{ fontSize: 12, marginLeft: 4 }} />
            </Button>
          </Dropdown>
          <Dropdown
            droplist={
              <Menu>
                <Menu.Item key="selected" onClick={handleBatchDeleteSelected}>
                  删除已选 ({selectedKeys.length} 条)
                </Menu.Item>
                <Menu.Item key="all" onClick={handleDeleteAll} style={{ color: '#F53F3F' }}>
                  删除全部 ({total} 条)
                </Menu.Item>
              </Menu>
            }
            trigger="click" position="bl"
          >
            <Button status="danger" icon={<IconDelete />}>
              删除会员 <IconDown style={{ fontSize: 12, marginLeft: 4 }} />
            </Button>
          </Dropdown>
        </Space>
        <Tooltip content="列表配置">
          <Button icon={<IconSettings />} onClick={() => setConfigVisible(true)} />
        </Tooltip>
      </div>

      {/* 已选提示条 */}
      {selectedKeys.length > 0 && (
        <div className="batch-bar">
          <span style={{ color: '#1677FF', fontSize: 14 }}>
            已选中 <strong>{selectedKeys.length}</strong> 项
          </span>
          <Button type="text" size="small" onClick={() => setSelectedKeys([])}>清除选择</Button>
        </div>
      )}

      {/* 表格 */}
      <div className="site-card" style={{ padding: 0 }}>
        <Table<any>
          rowKey="id"
          columns={buildColumns()}
          data={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          border
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: true,
            sizeCanChange: true,
            pageSizeChangeResetCurrent: true,
            sizeOptions: [10, 20, 50, 100],
            onChange: (p: number, ps: number) => { setPage(p); setPageSize(ps); },
          }}
          rowSelection={rowSelection}
          noDataElement={
            <div style={{ textAlign: 'center', padding: 40 }}>
              <IconUser style={{ fontSize: 48, color: '#C9CDD4' }} />
              <div style={{ marginTop: 16, color: '#86909C' }}>暂无会员数据，点击新增会员</div>
            </div>
          }
        />
      </div>

      {/* 列表配置抽屉 */}
      <Drawer
        title="列表配置"
        visible={configVisible}
        onCancel={() => setConfigVisible(false)}
        width={320}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={() => {
                setVisibleColumns(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
              }}
            >
              恢复默认
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setVisibleColumns(ALL_COLUMNS.map((c) => c.key));
              }}
            >
              全部显示
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#86909C', fontSize: 13, marginBottom: 8 }}>
            勾选需要在列表中展示的字段
          </div>
          <Checkbox.Group
            value={visibleColumns}
            onChange={(vals) => setVisibleColumns(vals as string[])}
            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {ALL_COLUMNS.map((col) => (
              <Checkbox key={col.key} value={col.key}>
                {col.title}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
      </Drawer>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入会员"
        visible={importVisible}
        onCancel={() => setImportVisible(false)}
        footer={
          <>
            <Button onClick={() => setImportVisible(false)}>取消</Button>
            <Button type="primary" loading={importLoading} onClick={handleImport}>开始导入</Button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Button icon={<IconFile />} onClick={handleDownloadTemplate} type="outline">
              下载导入模板
            </Button>
          </div>
          <Upload drag accept=".csv,.xlsx" tip="支持 CSV / Excel 格式，单次最多 10,000 条" style={{ width: '100%' }} />
          <div style={{ marginTop: 16, color: '#86909C', fontSize: 13 }}>
            数据量大时将自动分批处理，请耐心等待
          </div>
        </div>
      </Modal>
    </div>
  );
}
