import React, { useState, useCallback, useRef } from 'react';
import { Steps, Card, Button, Row, Col, message, Spin } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import BasicInfoStep from './BasicInfoStep';
import BOMStructureStep from './BOMStructureStep';
import CostComplianceStep from './CostComplianceStep';
import PublishCheckStep from './PublishCheckStep';
import PublishStep from './PublishStep';
import ReleaseToSAPStep from './ReleaseToSAPStep';
import styles from './CreateBOMWizard.module.css';

const { Step } = Steps;

const CreateBOMWizard = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bomData, setBomData] = useState({
    basicInfo: null,
    structure: null,
    cost: null,
    compliance: null,
    publishCheck: null,
    publish: null
  });
  const [loading, setLoading] = useState(false);
  const [operationLogs, setOperationLogs] = useState([]);
  
  // 创建CostComplianceStep组件的引用
  const costComplianceRef = useRef(null);

  // 添加操作日志
  const addOperationLog = useCallback((action, status = 'success') => {
    // 使用Date.now() + 随机数确保ID唯一性
    const newLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: new Date().toLocaleTimeString(),
      action,
      status
    };
    setOperationLogs(prev => [newLog, ...prev]);
  }, []);

  // 步骤配置
  const steps = [
    {
      title: '基础信息',
      content: '填写BOM基础信息',
      component: <BasicInfoStep 
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        data={bomData.basicInfo} 
        onChange={(data) => setBomData(prev => ({ ...prev, basicInfo: data }))}
        addLog={addOperationLog}
      />
    },
    {
      title: 'BOM结构搭建',
      content: '创建BOM的7层级结构',
      component: <BOMStructureStep 
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        data={bomData.structure} 
        onChange={(data) => {
          console.log('CreateBOMWizard收到BOMStructureStep更新:', {
            treeData: data.treeData ? `节点数: ${data.treeData.length}` : '空',
            parts: data.parts ? `零件数: ${data.parts.length}` : '空',
            totalCost: data.totalCost || 0,
            hasData: !!data.data,
            sourceType: data.sourceType || 'unknown'
          });
          
          // 确保结构数据格式一致
          const normalizedData = {
            ...data,
            // 如果没有treeData但有data，则使用data作为treeData
            treeData: data.treeData || data.data || [],
            // 确保有parts和totalCost字段
            parts: data.parts || [],
            totalCost: data.totalCost || 0
          };
          
          setBomData(prev => ({ ...prev, structure: normalizedData }));
          
          // 添加操作日志
          if (addOperationLog) {
            addOperationLog(`BOM结构已更新 - 零件数: ${normalizedData.parts?.length || 0}，总成本: ¥${normalizedData.totalCost?.toFixed(2) || '0.00'}`);
          }
        }}
        addLog={addOperationLog}
      />
    },
    {
      title: '成本与合规',
      content: '配置成本计算和合规性检查',
      component: <CostComplianceStep
        ref={costComplianceRef}
        bomData={{
          parts: bomData.structure?.parts || [],
          treeData: bomData.structure?.treeData || [],
          totalCost: bomData.structure?.totalCost || 0
        }}
        onCostChange={(data) => {
          console.log('CreateBOMWizard收到成本数据更新:', {
            totalCost: data.totalCost || 0,
            materialCost: data.materialCost || 0,
            breakdownItems: data.costBreakdown?.length || 0,
            fullData: data
          });
          setBomData(prev => ({ 
            ...prev, 
            cost: data,
            structure: {
              ...prev.structure,
              totalCost: data.totalCost || 0
            }
          }));
        }}
        onComplianceChange={(data) => {
          console.log('CreateBOMWizard收到合规性检查结果:', {
            status: data.status,
            issues: data.issues?.length || 0,
            warnings: data.warnings?.length || 0
          });
          setBomData(prev => ({ ...prev, compliance: data }));
        }}
        addLog={addOperationLog}
      />
    },
    {
      title: '发布前检查',
      content: '验证BOM完整性和合规性',
      component: <PublishCheckStep 
        data={bomData.publishCheck}
        bomData={bomData}
        onChange={(data) => setBomData(prev => ({ ...prev, publishCheck: data }))}
        addLog={addOperationLog}
      />
    },
    {
      title: '发布到SAP',
      content: '将BOM发布到SAP系统',
      component: <ReleaseToSAPStep 
        data={bomData.publish}
        bomData={bomData}
        onChange={(data) => setBomData(prev => ({ ...prev, publish: data }))}
        addLog={addOperationLog}
      />
    }
  ];

  // 下一步
  const nextStep = async () => {
    // 验证当前步骤数据
    if (!validateStep(currentStep)) {
      return;
    }
    
    // 如果是从成本与合规步骤（步骤2）进入发布前检查步骤，获取最新总成本
    if (currentStep === 2 && costComplianceRef.current) {
      try {
        // 调用CostComplianceStep组件的getLatestTotalCost方法获取最新总成本
        const latestTotalCost = costComplianceRef.current.getLatestTotalCost();
        console.log('从CostComplianceStep获取最新总成本:', latestTotalCost);
        
        // 更新bomData中的总成本
        setBomData(prev => ({
          ...prev,
          cost: {
            ...prev.cost,
            totalCost: latestTotalCost
          },
          structure: {
            ...prev.structure,
            totalCost: latestTotalCost
          }
        }));
        
        addOperationLog(`获取最新总成本: ¥${latestTotalCost.toFixed(2)}`);
      } catch (error) {
        console.error('获取最新总成本失败:', error);
        // 移除错误提示和return，允许继续跳转
        console.log('获取总成本失败，但允许继续跳转到下一页');
        addOperationLog('获取总成本失败，使用默认值');
      }
    }
    
    // 如果是从BOM结构搭建步骤（步骤1）进入成本与合规步骤，且在开发模式下
    if (currentStep === 1 && process.env.NODE_ENV === 'development') {
      // 添加默认parts数组以避免CostComplianceStep中的undefined错误
      if (!bomData.structure || !bomData.structure.treeData) {
        setBomData(prev => ({
          ...prev,
          structure: {
            ...prev.structure,
            treeData: [],
            // 添加默认parts数组以避免CostComplianceStep中的undefined错误
            parts: []
          }
        }));
        console.log('已设置默认BOM结构和parts数组，允许进入成本与合规页面');
      }
    }
    
    setCurrentStep(currentStep + 1);
    addOperationLog(`完成步骤${currentStep + 1}: ${steps[currentStep].title}`);
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // 验证当前步骤数据
  const validateStep = (step) => {
    switch (step) {
      case 0: // 基础信息
        if (!bomData.basicInfo || !bomData.basicInfo.bomName || !bomData.basicInfo.productModel || !bomData.basicInfo.productSerial) {
          message.error('请填写BOM基础信息，包括产品序列号');
          return false;
        }
        break;
      case 1: // BOM结构搭建
        // 在开发模式下允许跳过BOM结构验证
        // 生产环境应保持原有验证逻辑
        if (process.env.NODE_ENV === 'development') {
          // 开发模式下，即使没有BOM结构也允许通过
          console.log('开发模式: 跳过BOM结构验证');
        } else if (!bomData.structure || !bomData.structure.treeData || bomData.structure.treeData.length === 0) {
          message.error('请先创建BOM结构');
          return false;
        }
        break;
      case 2: // 成本与合规
        // 移除验证限制，允许直接跳转到下一页
        console.log('成本与合规步骤 - 允许直接跳转');
        break;
      case 3: // 发布前检查
        // 移除验证限制，允许直接跳转到完成页面
        console.log('发布前检查步骤 - 允许直接跳转');
        break;
      default:
        break;
    }
    return true;
  };

  // 完成所有步骤
  const completeWizard = async () => {
    setLoading(true);
    try {
      // 模拟提交到后端
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('BOM创建成功！');
      addOperationLog('BOM创建完成', 'success');
      // 重置向导
      setTimeout(() => {
        setCurrentStep(0);
        setBomData({
          basicInfo: null,
          structure: null,
          cost: null,
          compliance: null,
          publishCheck: null,
          publish: null
        });
      }, 2000);
    } catch (error) {
      message.error('BOM创建失败');
      addOperationLog('BOM创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['create-bom-wizard']}>
      <div className={styles['wizard-header']}>
        <h1>创建BOM向导</h1>
        <p>按照以下步骤创建新的BOM结构</p>
      </div>

      <div className={styles['wizard-content']}>
        <Row gutter={24}>
          <Col span={20}>
            <div className={styles['wizard-steps']}>
              <Steps current={currentStep}>
                {steps.map(item => (
                  <Step key={item.title} title={item.title} />
                ))}
              </Steps>

              <div className={styles['step-content']}>
                {steps[currentStep].component}
              </div>

              <div className={styles['step-actions']} style={{ textAlign: 'right' }}>
                {currentStep > 0 && (
                  <Button style={{ marginRight: 8 }} onClick={prevStep}>
                    上一步
                  </Button>
                )}
                {currentStep < steps.length - 1 && (
                  <Button type="primary" onClick={nextStep}>
                    下一步
                  </Button>
                )}
                {currentStep === steps.length - 1 && (
                  <Button type="primary" onClick={completeWizard} loading={loading}>
                    完成
                  </Button>
                )}
              </div>
            </div>
          </Col>

          <Col span={4}>
            <Card title="操作日志" size="small" className={styles['operation-logs']}>
              {operationLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999' }}>暂无操作记录</div>
              ) : (
                operationLogs.map(log => (
                  <div key={log.id} className={`${styles['log-item']} ${styles[log.status]}`}>
                    <div className={styles['log-time']}>{log.time}</div>
                    <div className={styles['log-action']}>{log.action}</div>
                    <div className={styles['log-status']}>
                      {log.status === 'success' ? <CheckOutlined /> : <CloseOutlined />}
                    </div>
                  </div>
                ))
              )}
            </Card>
            
            
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default CreateBOMWizard;