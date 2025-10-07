import { Link } from "react-router-dom";
import BackSvg from "@/assets/images/back.svg";

type Props = {
  onClick?: () => void;
  goto: string;
};

const Back = ({ goto, onClick }: Props) => {
  return (
    <Link
      to={goto}
      className="group text-gray-500 text-sm flex items-center gap-x-2"
      onClick={onClick}
    >
      <img src={BackSvg} alt="back icon" className="group-hover:fill-black" />
      <span className="group-hover:font-medium">Back</span>
    </Link>
  );
};

export default Back;
