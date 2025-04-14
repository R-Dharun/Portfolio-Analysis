import { createClient } from '@supabase/supabase-js';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// These will be replaced with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export const handler = async (event) => {
  try {
    const { timeframe } = JSON.parse(event.body);
    let startDate, endDate;

    switch (timeframe) {
      case 'weekly':
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
        break;
      case 'monthly':
        startDate = startOfMonth(new Date());
        endDate = endOfMonth(new Date());
        break;
      case 'yearly':
        startDate = startOfYear(new Date());
        endDate = endOfYear(new Date());
        break;
      default:
        startDate = startOfWeek(new Date());
        endDate = endOfWeek(new Date());
    }

    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};