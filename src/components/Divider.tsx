interface DividerProps {
    width: string;
    color: string;
    className: string;
}

const Divider = ({width, color, className}: DividerProps) => {
  return (
    <div className={`w-[${width}] border-t-[1.5px] my-2 border-opacity-5 border-[${color}] ${className}`}></div>
  )
}

export default Divider;