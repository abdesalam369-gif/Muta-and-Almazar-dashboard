
import React from 'react';

const Loader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-50/95 flex flex-col items-center justify-center z-50">
            <div 
                className="w-20 h-20 border-6 border-transparent rounded-full animate-spin"
                style={{ borderTopColor: '#2563eb', borderRightColor: '#06b6d4', borderBottomColor: '#9333ea' }}
            ></div>
            <p className="mt-5 text-2xl font-bold text-slate-800 tracking-wider">جاري التحميل...</p>
        </div>
    );
};

export default Loader;
