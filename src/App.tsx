import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Activity, Calendar, Users, TrendingUp } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { supabase } from './lib/supabase';

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ElementType;
  className?: string;
};

function StatCard({ title, value, icon: Icon, className = '' }: StatCardProps) {
  return (
    <div className={`bg-gray-800 p-6 rounded-xl shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
    </div>
  );
}

type ViewData = {
  date: string;
  views: number;
};

type RawView = {
  timestamp: string;
};

function App() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [data, setData] = useState<ViewData[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const now = new Date();
        let startDate: Date;

        switch (timeframe) {
          case 'weekly':
            startDate = subWeeks(now, 1);
            break;
          case 'monthly':
            startDate = subMonths(now, 1);
            break;
          case 'yearly':
            startDate = subYears(now, 1);
            break;
          default:
            startDate = subWeeks(now, 1);
        }

        const { data: viewsData, error: supabaseError } = await supabase
          .from('visits')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .lte('timestamp', now.toISOString())
          .order('timestamp', { ascending: true });

        if (supabaseError) throw new Error(supabaseError.message);
        if (!viewsData) {
          setData([]);
          setTotalViews(0);
          return;
        }

        const dateFormat = timeframe === 'yearly' ? 'MMM yyyy' : 'MMM dd';

        const processedData = (viewsData as RawView[]).reduce((acc: ViewData[], curr) => {
          const date = format(new Date(curr.timestamp), dateFormat);
          const existingEntry = acc.find((entry) => entry.date === date);
          if (existingEntry) {
            existingEntry.views += 1;
          } else {
            acc.push({ date, views: 1 });
          }
          return acc;
        }, []);

        const filledData: ViewData[] = [];
        let currentDate = startDate;

        while (currentDate <= now) {
          const dateStr = format(currentDate, dateFormat);
          const existingData = processedData.find((d) => d.date === dateStr);
          filledData.push({
            date: dateStr,
            views: existingData ? existingData.views : 0,
          });

          currentDate = timeframe === 'yearly'
            ? subMonths(currentDate, -1)
            : subDays(currentDate, -1);
        }

        setData(filledData);
        setTotalViews(filledData.reduce((acc, curr) => acc + curr.views, 0));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Portfolio Analytics Dashboard</h1>
          <div className="flex gap-4">
            {['weekly', 'monthly', 'yearly'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as 'weekly' | 'monthly' | 'yearly')}
                className={`px-4 py-2 rounded-lg transition-colors ${timeframe === tf ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Views" value={totalViews} icon={Users} />
          <StatCard title="Average Daily Views" value={Math.round(totalViews / (data.length || 1))} icon={Activity} />
          <StatCard title="Peak Views" value={Math.max(...data.map((d) => d.views), 0)} icon={TrendingUp} />
          <StatCard title="Time Period" value={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} icon={Calendar} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Views Over Time</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="views" stroke="#3B82F6" fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Daily Distribution</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="views" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
