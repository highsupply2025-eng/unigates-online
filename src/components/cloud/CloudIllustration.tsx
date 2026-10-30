import { Cloud, GraduationCap, Landmark, School, Languages, Users, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CloudIllustration() {
  const { isRtl } = useLanguage();
  return (
    <div className="cloud-diagram" role="img" aria-label={isRtl ? "مساحة سحابية تربط المؤسسة بإدارتها ومعلميها وطلابها" : "A cloud workspace connects institutions, teachers and students"}>
      <div className="cloud-diagram-grid" />
      <div className="cloud-wire cloud-wire-top" /><div className="cloud-wire cloud-wire-bottom" />
      <div className="cloud-node cloud-node-one"><Landmark /><span>{isRtl ? "الكليات والمعاهد" : "Colleges & institutes"}</span></div>
      <div className="cloud-node cloud-node-two"><School /><span>{isRtl ? "المدارس" : "Schools"}</span></div>
      <div className="cloud-node cloud-node-three"><Languages /><span>{isRtl ? "مراكز اللغة والتدريب" : "Language & training"}</span></div>
      <div className="cloud-core"><Cloud className="cloud-core-icon" /><strong>UNIGATES</strong><span>{isRtl ? "مساحتك التعليمية" : "Your educational space"}</span></div>
      <div className="cloud-node cloud-node-four"><Users /><span>{isRtl ? "إدارة مؤسستك" : "Your administration"}</span></div>
      <div className="cloud-node cloud-node-five"><GraduationCap /><span>{isRtl ? "المعلمون والطلاب" : "Teachers & students"}</span></div>
      <div className="cloud-connected"><Check size={14} />{isRtl ? "كل شيء متصل. بهويتك." : "Connected. Under your identity."}</div>
    </div>
  );
}