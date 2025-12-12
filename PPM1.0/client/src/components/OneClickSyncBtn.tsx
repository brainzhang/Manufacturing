import React from 'react';
import { Button, Progress, Tooltip } from 'antd';
import { CloudSyncOutlined, LoadingOutlined } from '@ant-design/icons';
import styles from './OneClickSyncBtn.module.css?inline';

interface OneClickSyncBtnProps {
  onClick: () => void;
  loading: boolean;
  progress?: number;
  disabled?: boolean;
  syncableCount?: number;
}

const OneClickSyncBtn: React.FC<OneClickSyncBtnProps> = ({
  onClick,
  loading,
  progress = 0,
  disabled = false,
  syncableCount = 0,
}) => {
  return (
    <Tooltip
      title={
        loading
          ? `正在同步... ${progress}%`
          : syncableCount > 0
          ? `可同步 ${syncableCount} 项差异`
          : '暂无可同步的差异'
      }
      placement="left"
      arrow
    >
      <div className={styles.syncButtonContainer}>
        <Button
          type="primary"
          danger
          icon={loading ? <LoadingOutlined spin /> : <CloudSyncOutlined />}
          onClick={onClick}
          loading={loading}
          disabled={disabled || syncableCount === 0}
          className={styles.syncButton}
          size="large"
        >
          一键同步
          {syncableCount > 0 && !loading && (
            <span className={styles.syncCount}>({syncableCount})</span>
          )}
        </Button>
        
        {loading && progress > 0 && (
          <div className={styles.progressContainer}>
            <Progress
              percent={progress}
              status="active"
              strokeColor={{
                '0%': '#ff4d4f',
                '100%': '#52c41a',
              }}
              className={styles.progress}
            />
            <span className={styles.progressText}>{progress}%</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default OneClickSyncBtn;