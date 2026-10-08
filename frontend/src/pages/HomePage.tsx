import { StatCard } from '../components/ui/StatCard';
import { DailyQuests } from '../components/home/DailyQuests';
import { FeaturedLessonCard } from '../components/home/FeaturedLessonCard';
import { HeroBanner } from '../components/home/HeroBanner';
import { CulturalTip, LeaderboardCard, SrsCard } from '../components/home/RightRailCards';
import { WeeklyPracticeChart } from '../components/home/WeeklyPracticeChart';

export function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HeroBanner />
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Tóm tắt tiến độ">
        <StatCard label="Đã làm chủ" value="142" suffix="từ" detail="+12 từ tuần này" icon="menu_book" detailIcon="trending_up" />
        <StatCard label="Thời gian luyện tập" value="5.4" suffix="giờ" detail="Mục tiêu: 6.0 giờ (90%)" icon="timer" detailTone="muted" />
        <StatCard label="Camera AI nhận diện" value="91.5%" detail="Độ chuẩn xác cao" icon="videocam" detailIcon="verified" />
        <StatCard label="Chuỗi ngày kiên trì" value="14" suffix="ngày" detail="Kỷ lục cá nhân mới!" icon="whatshot" detailIcon="local_fire_department" detailTone="error" />
      </section>
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <FeaturedLessonCard />
          <WeeklyPracticeChart />
          <DailyQuests />
        </div>
        <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Thông tin bổ trợ">
          <SrsCard />
          <LeaderboardCard />
          <CulturalTip />
        </aside>
      </section>
    </div>
  );
}
