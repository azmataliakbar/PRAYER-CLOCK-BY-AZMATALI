'use client';

import { useEffect, useState } from 'react';
import { PrayerTimesData } from '@/lib/types';

interface PrayerTimesProps {
  city?: string;
  country?: string;
}

export default function PrayerTimes({ city = 'Karachi', country = 'Pakistan' }: PrayerTimesProps) {
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayerName, setNextPrayerName] = useState<string | null>(null);

  const prayers = [
    { name: 'Fajr', arabic: 'فجر' },
    { name: 'Dhuhr', arabic: 'ظہر' },
    { name: 'Asr', arabic: 'عصر' },
    { name: 'Maghrib', arabic: 'مغرب' },
    { name: 'Isha', arabic: 'عشاء' },
  ];

  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '--:--';
    
    const timePart = time24.split(' ')[0];
    const [hourStr, minuteStr] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;
    
    return `${hour}:${minute} ${ampm}`;
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, [city, country]);

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/prayers?city=${city}&country=${country}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPrayerData(data);
      
      // Determine next prayer (handles next day Fajr)
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      let foundNextPrayer: string | null = null;
      
      for (const prayer of prayers) {
        const timeStr = data.data.timings[prayer.name].split(' ')[0];
        const [hour, minute] = timeStr.split(':').map(Number);
        const prayerTimeMinutes = hour * 60 + minute;
        
        if (prayerTimeMinutes > currentTimeMinutes) {
          foundNextPrayer = prayer.name;
          break;
        }
      }
      
      // If no prayer found today, show Fajr as next (for tomorrow)
      if (foundNextPrayer) {
        setNextPrayerName(foundNextPrayer);
      } else {
        setNextPrayerName('Fajr');
      }
    } catch (err) {
      setError('Unable to load prayer times');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 sm:py-20">
        <div className="animate-pulse text-forced-dark">Loading prayer times...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 sm:py-20">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchPrayerTimes} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg shadow-md">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
      {prayers.map((prayer) => {
        const isNext = nextPrayerName === prayer.name;
        const timeStr = prayerData?.data.timings[prayer.name as keyof typeof prayerData.data.timings] || '--:--';
        const displayTime12Hour = convertTo12Hour(timeStr);
        
        return (
          <div
            key={prayer.name}
            className={`p-2 xs:p-3 sm:p-4 rounded-xl flex justify-between items-center transition-all duration-300 ${
              isNext ? 'highlight-prayer' : 'glass-card-forced'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm xs:text-base sm:text-lg font-semibold text-forced-dark">
                {prayer.name}
              </span>
              <span className="text-base xs:text-3xl sm:text-xl md:text-3xl font-arabic text-forced-green" style={{ fontFamily: "'Amiri', 'Noto Naskh Arabic', serif" }}>
                {prayer.arabic}
              </span>
            </div>
            <div className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-mono font-bold text-forced-black">
              {displayTime12Hour}
            </div>
          </div>
        );
      })}
    </div>
  );
}