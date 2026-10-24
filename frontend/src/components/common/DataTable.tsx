import type { ReactNode } from 'react';
import { Empty } from '../ui';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (item: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T, index: number) => string | number;
  emptyText?: string;
  emptyIcon?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyText = 'Không tìm thấy dữ liệu phù hợp',
  emptyIcon,
}: DataTableProps<T>) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? 'left',
                  width: col.width,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={rowKey(item, index)}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align ?? 'left' }}
                >
                  {col.render(item, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && <Empty text={emptyText} icon={emptyIcon} />}
    </div>
  );
}

export default DataTable;
