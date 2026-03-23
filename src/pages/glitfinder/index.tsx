import HomeLayout from '@/layout/home/HomeLayout';
import GlitfinderSetupModal from '@/components/Modal/GlitfinderSetupModal';
import GlitfinderHome from './GlitfinderHome';
import GlitfinderSetup from './GlitfinderSetup';
import { useGetMyGlitProfileQuery } from '@/redux/glitfinder';

const Glitfinder = () => {
  const { data, error, isLoading } = useGetMyGlitProfileQuery();

  const hasProfile = data?.data?.profile && !error;
  const showSetupModal = !isLoading && !hasProfile;

  return (
    <HomeLayout isLoading={isLoading} showNavBar={false}>
      <GlitfinderHome />

      <GlitfinderSetupModal isOpen={showSetupModal}>
        <GlitfinderSetup />
      </GlitfinderSetupModal>
    </HomeLayout>
  );
};

export default Glitfinder;