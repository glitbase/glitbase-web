import logo from '@/assets/images/logo.svg';

interface PageLoaderProps {
  className?: string;
}

const PageLoader = ({ className }: PageLoaderProps) => {
  return (
    <div className="h-svh w-full flex justify-center items-center bg-[#F3EDE1]">
      <div
        className={`flex items-center space-x-2 relative py-6 animate-pulse ${className}`}
      >
        <img src={logo} className="transform scale-[1.5]" />
      </div>
    </div>
  );
};
export default PageLoader;
