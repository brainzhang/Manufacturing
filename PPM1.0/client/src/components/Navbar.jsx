import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="font-bold text-xl">PPM</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link 
                  to="/" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'bg-gray-900' : 'hover:bg-gray-700'}`}
                >
                  智能仪表板
                </Link>
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center">
                    产品组合
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link to="/products/list" className="block px-4 py-2 text-sm hover:bg-gray-600">产品库</Link>
                      <Link to="/products/create" className="block px-4 py-2 text-sm hover:bg-gray-600">产品生成器</Link>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center">
                    BOM中心
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link to="/boms" className="block px-4 py-2 text-sm hover:bg-gray-600">BOM列表</Link>
                      <Link to="/bom-generator" className="block px-4 py-2 text-sm hover:bg-gray-600">快速生成BOM</Link>
                      <Link to="/bom-compare" className="block px-4 py-2 text-sm hover:bg-gray-600">批量比对</Link>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center">
                    零件库
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link to="/parts" className="block px-4 py-2 text-sm hover:bg-gray-600">零件搜索</Link>
                      <Link to="/parts/import" className="block px-4 py-2 text-sm hover:bg-gray-600">批量导入</Link>
                      <Link to="/parts/alternatives" className="block px-4 py-2 text-sm hover:bg-gray-600">替代料</Link>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center">
                    对齐中心
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link to="/alignment/radar" className="block px-4 py-2 text-sm hover:bg-gray-600">差异雷达</Link>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <button className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center">
                    报表中心
                    <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-700 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link to="/reports/cost" className="block px-4 py-2 text-sm hover:bg-gray-600">成本看板</Link>
                      <Link to="/reports/compliance" className="block px-4 py-2 text-sm hover:bg-gray-600">合规看板</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <span className="mr-4 text-sm">管理员</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;