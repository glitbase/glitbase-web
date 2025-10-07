import logo from "@/assets/images/logo.svg";

interface PageLoaderProps {
    className?: string;
}

const FullLogo = ({className}: PageLoaderProps) => {
  return (
    <div className={`flex items-center space-x-2 relative py-6 ${className}`}>
        <img src={logo} />
    </div>
  )
}

export default FullLogo 