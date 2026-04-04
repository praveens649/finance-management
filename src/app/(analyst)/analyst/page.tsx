import React from "react";

export const metadata = {
  title: "Analyst Workspace | Finance Management",
  description: "Analytics and robust data metrics tracking platform",
};

export default function AnalystWorkspacePage() {
  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-zinc-800 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Metrics & Analytics</h1>
            <p className="text-zinc-400 text-sm">Analyze financial trends, forecast budgeting, and review transaction flow.</p>
          </div>
          <div className="flex items-center gap-4">
             <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-sm font-medium text-zinc-300 border border-zinc-700 rounded-lg transition-colors flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
             </button>
             <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20 ring-2 ring-zinc-900 border border-zinc-800">
               AY
             </div>
          </div>
        </header>

        {/* Dynamic Metric Cards Placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Gross Margin" value="38.4%" trend="+4.1%" trendUp />
          <StatCard title="Total Cash Flow" value="$1.2M" trend="+$125k" trendUp />
          <StatCard title="Operational Tx" value="1,492" trend="-3%" trendUp={false} />
          <StatCard title="Pending Audits" value="12" trend="+3" trendUp={false} isNeutral />
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 min-h-[500px] flex items-center justify-center relative overflow-hidden group">
            {/* Ambient Background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-teal-500/10 transition-colors duration-700" />
            <div className="text-center">
               <svg className="w-16 h-16 text-zinc-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               <p className="text-zinc-500 font-medium text-lg">Financial Modeling Graph</p>
               <p className="text-zinc-600 text-sm mt-1">Connect your database to render live charts.</p>
            </div>
          </div>
          
          <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 min-h-[500px] flex flex-col">
             <h3 className="text-white font-medium mb-4">Latest Insights</h3>
             <div className="space-y-4 flex-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4">
                    <p className="text-sm text-zinc-300 font-medium mb-1">Unusual spending detected in &apos;Marketing&apos;</p>
                    <p className="text-xs text-zinc-500">2 hours ago • Category Audit</p>
                  </div>
                ))}
             </div>
             <button className="w-full mt-4 py-2 bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors text-zinc-300 text-sm font-medium border border-zinc-700/50 rounded-lg">
                View All Reports
             </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, trend, trendUp, isNeutral = false }: { title: string, value: string, trend: string, trendUp: boolean, isNeutral?: boolean }) {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:bg-zinc-900/60 transition-colors">
      <h3 className="text-zinc-400 font-medium text-sm mb-3">{title}</h3>
      <div className="flex items-baseline gap-3">
         <p className="text-3xl font-bold text-white">{value}</p>
         <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isNeutral ? 'bg-zinc-800 text-zinc-400' : trendUp ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
           {trend}
         </span>
      </div>
    </div>
  );
}
