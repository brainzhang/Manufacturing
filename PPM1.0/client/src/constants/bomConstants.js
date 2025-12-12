// 7层BOM树结构常量
export const BOM_LEVELS = {
  L1: { name: '整机', level: 1, isParent: true, canHaveParts: false },
  L2: { name: '大模块', level: 2, isParent: true, canHaveParts: false },
  L3: { name: '子模块', level: 3, isParent: true, canHaveParts: false },
  L4: { name: '零件族', level: 4, isParent: true, canHaveParts: false },
  L5: { name: '零件组', level: 5, isParent: true, canHaveParts: false },
  L6: { name: '主料', level: 6, isParent: false, canHaveParts: true },
  L7: { name: '替代料', level: 7, isParent: false, canHaveParts: true }
};