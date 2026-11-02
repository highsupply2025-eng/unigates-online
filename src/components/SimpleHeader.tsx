import CloudHeader from "@/components/cloud/CloudHeader";

type SimpleHeaderProps = {
  backTo?: string;
  mobileBackOnly?: boolean;
  useHistoryBack?: boolean;
  subtitle?: string;
};

const SimpleHeader = ({ backTo = "/", mobileBackOnly = false, useHistoryBack = false, subtitle }: SimpleHeaderProps) => {
  return (
    <div className="cloud-site">
      <CloudHeader />
    </div>
  );
};

export default SimpleHeader;
