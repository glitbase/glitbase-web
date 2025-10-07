import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { CiCircleChevRight } from "react-icons/ci";
import clsx from "clsx";
import Divider from "../Divider";

interface AccordionProps {
    data: any[];
}

const Accordion = ({ data }: AccordionProps) => {
  return (
    <>
    {data?.map((i, index) => {
        return (
            <div>
            <Disclosure key={index}>
                {({ open }) => (
                    <div>
                    <DisclosureButton className="flex items-center justify-between gap-2 text-[1.1rem] text-[#232A38] font-medium w-full">
                        {i?.title}
                        <CiCircleChevRight style={{transition: '250ms ease'}} className={clsx("w-5", open && "rotate-90")} />
                    </DisclosureButton>
                    <DisclosurePanel className="origin-top transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0">{i?.content}</DisclosurePanel>
                    </div>
                )}
                
            </Disclosure>
            <Divider className="my-8" width={"full"} color={"red"} />
            </div>
        )
    })}
    </>
  );
};

export default Accordion;
