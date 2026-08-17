import { redirect } from 'next/navigation';

/** 根页面重定向到会员列表 */
export default function RootPage() {
  redirect('/members');
}
