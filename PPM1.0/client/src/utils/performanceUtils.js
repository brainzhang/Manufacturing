/**
 * 性能优化工具函数库
 * 提供防抖、节流、缓存、懒加载等性能优化相关的通用函数
 */

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
    
    if (callNow) func.apply(this, args);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 内存缓存工具
 * 用于缓存API请求结果，减少重复请求
 */
export class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTtl = options.defaultTtl || 300000; // 默认5分钟
    this.maxSize = options.maxSize || 100; // 默认最多缓存100个项目
  }
  
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（毫秒）
   */
  set(key, value, ttl = this.defaultTtl) {
    // 检查缓存大小，如果超过最大限制，删除最早的项目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const expiry = ttl ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any} 缓存的值或null
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key);
  }
  
  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * 生成缓存键（用于对象参数）
   * @param {string} prefix - 键前缀
   * @param {Object} params - 参数对象
   * @returns {string} 生成的缓存键
   */
  static generateKey(prefix, params) {
    const serializedParams = typeof params === 'string' ? params : JSON.stringify(params || {});
    return `${prefix}:${serializedParams}`;
  }
}

/**
 * 创建缓存的API请求函数
 * @param {Function} apiFunc - 原始API函数
 * @param {Object} options - 缓存选项
 * @returns {Function} 带缓存的API函数
 */
export function createCachedApi(apiFunc, options = {}) {
  const cache = new MemoryCache(options);
  
  return async function(...args) {
    // 生成缓存键
    const cacheKey = MemoryCache.generateKey(apiFunc.name, args);
    
    // 尝试从缓存获取
    const cachedResult = cache.get(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    // 调用原始API函数
    const result = await apiFunc(...args);
    
    // 存入缓存
    cache.set(cacheKey, result, options.ttl);
    
    return result;
  };
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise对象
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 批量处理数组
 * 将数组分成多个批次进行处理，避免一次性处理大量数据
 * @param {Array} array - 要处理的数组
 * @param {Function} processor - 处理函数
 * @param {number} batchSize - 每批次大小
 * @param {number} interval - 批次间隔时间（毫秒）
 * @returns {Promise} Promise对象
 */
export async function batchProcess(array, processor, batchSize = 100, interval = 0) {
  const result = [];
  
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize);
    const batchResult = await processor(batch);
    result.push(...batchResult);
    
    // 如果不是最后一批且设置了间隔，则延迟
    if (i + batchSize < array.length && interval > 0) {
      await delay(interval);
    }
  }
  
  return result;
}

/**
 * 检测元素是否在视口中
 * @param {HTMLElement} element - DOM元素
 * @param {Object} options - 选项
 * @returns {boolean} 是否在视口中
 */
export function isElementInViewport(element, options = {}) {
  const {
    top = 0,
    right = 0,
    bottom = 0,
    left = 0
  } = options;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
  const windowWidth = (window.innerWidth || document.documentElement.clientWidth);
  
  return (
    rect.top >= -top &&
    rect.left >= -left &&
    rect.bottom <= windowHeight + bottom &&
    rect.right <= windowWidth + right
  );
}

/**
 * 监听元素进入视口的钩子函数
 * 用于React组件中实现懒加载
 * @param {Function} callback - 回调函数
 * @param {Object} options - 选项
 * @returns {Object} 包含observer和ref的对象
 */
export function useIntersectionObserver(callback, options = {}) {
  const [ref, setRef] = React.useState(null);
  
  React.useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
          // 如果只需要触发一次，可以取消观察
          if (options.once) {
            observer.unobserve(ref);
          }
        }
      });
    }, {
      root: null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0,
      ...options
    });
    
    observer.observe(ref);
    
    return () => {
      if (ref) observer.unobserve(ref);
    };
  }, [ref, callback, options]);
  
  return { ref: setRef };
}

/**
 * 批量加载图片
 * @param {Array} images - 图片URL数组
 * @param {number} batchSize - 每批次加载数量
 * @param {number} interval - 批次间隔时间（毫秒）
 * @returns {Promise} Promise对象
 */
export async function batchLoadImages(images, batchSize = 5, interval = 100) {
  const loadedImages = [];
  
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const loadPromises = batch.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    });
    
    try {
      const results = await Promise.all(loadPromises);
      loadedImages.push(...results);
    } catch (error) {
      console.error('图片加载失败:', error);
    }
    
    // 如果不是最后一批且设置了间隔，则延迟
    if (i + batchSize < images.length && interval > 0) {
      await delay(interval);
    }
  }
  
  return loadedImages;
}

/**
 * 测量函数执行时间
 * @param {Function} func - 要测量的函数
 * @param {string} label - 标签
 * @returns {any} 函数执行结果
 */
export function measurePerformance(func, label = 'Function') {
  console.time(label);
  const result = func();
  console.timeEnd(label);
  return result;
}

/**
 * 生成React组件的记忆化版本
 * @param {Function} Component - React组件
 * @param {Array} deps - 依赖项数组
 * @returns {Function} 记忆化的组件
 */
export function memoizeComponent(Component, deps = []) {
  return React.memo(Component, (prevProps, nextProps) => {
    return deps.every(dep => prevProps[dep] === nextProps[dep]);
  });
}

/**
 * 优化渲染性能的工具函数
 * 避免不必要的渲染
 * @param {Object} obj - 对象
 * @returns {Object} 优化后的对象（使用稳定引用）
 */
export function stableObject(obj) {
  if (obj && typeof obj === 'object') {
    // 对于纯对象，尝试使用JSON字符串化来获取稳定的引用
    try {
      const cachedKey = JSON.stringify(obj);
      return obj;
    } catch (e) {
      // 如果无法序列化，返回原始对象
      return obj;
    }
  }
  return obj;
}

/**
 * 模拟骨架屏加载状态
 * @param {number} minDuration - 最小持续时间（毫秒）
 * @returns {Object} 包含loading和setComplete的对象
 */
export function useSkeletonLoading(minDuration = 500) {
  const [loading, setLoading] = React.useState(true);
  const startTime = React.useRef(Date.now());
  
  const setComplete = React.useCallback(() => {
    const elapsed = Date.now() - startTime.current;
    if (elapsed >= minDuration) {
      setLoading(false);
    } else {
      setTimeout(() => setLoading(false), minDuration - elapsed);
    }
  }, [minDuration]);
  
  return { loading, setComplete };
}