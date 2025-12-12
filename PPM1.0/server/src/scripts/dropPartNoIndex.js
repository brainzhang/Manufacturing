const mongoose = require('mongoose');

// 删除part_no索引的脚本
async function dropPartNoIndex() {
  try {
    // 连接到数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ppm3';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('连接到MongoDB数据库...');

    // 获取数据库连接
    const db = mongoose.connection.db;

    // 删除parts集合中的part_no索引
    const result = await db.collection('parts').dropIndex('part_no_1');
    
    console.log('成功删除part_no索引:', result);
    
    // 验证索引是否已删除
    const indexes = await db.collection('parts').indexes();
    console.log('当前parts集合的索引:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}.`, index);
    });

    console.log('part_no索引删除完成！');

  } catch (error) {
    console.error('删除索引时出错:', error);
    
    // 如果索引不存在，尝试其他可能的索引名称
    if (error.codeName === 'IndexNotFound') {
      console.log('part_no_1索引不存在，尝试其他可能的索引名称...');
      
      try {
        const db = mongoose.connection.db;
        const indexes = await db.collection('parts').indexes();
        
        // 查找包含part_no的索引
        const partNoIndexes = indexes.filter(index => 
          JSON.stringify(index.key).includes('part_no')
        );
        
        if (partNoIndexes.length > 0) {
          console.log('找到包含part_no的索引:');
          for (let i = 0; i < partNoIndexes.length; i++) {
            const index = partNoIndexes[i];
            console.log(`${i + 1}.`, index);
            
            // 尝试删除这些索引
            const indexName = index.name || Object.keys(index.key)[0] + '_1';
            console.log(`尝试删除索引: ${indexName}`);
            
            try {
              await db.collection('parts').dropIndex(indexName);
              console.log(`成功删除索引: ${indexName}`);
            } catch (dropError) {
              console.log(`删除索引 ${indexName} 失败:`, dropError.message);
            }
          }
        } else {
          console.log('未找到包含part_no的索引，索引可能已经被删除。');
        }
      } catch (secondaryError) {
        console.error('处理索引时出错:', secondaryError);
      }
    }
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('数据库连接已关闭。');
  }
}

// 运行脚本
dropPartNoIndex().catch(console.error);