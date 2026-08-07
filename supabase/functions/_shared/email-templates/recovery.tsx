/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>إعادة تعيين كلمة المرور الخاصة بـ {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>UNIGATES</Heading>
        </Section>

        <Section style={card}>
          <Heading style={h1}>🔒 طلب إعادة تعيين كلمة المرور</Heading>
          <Text style={text}>
            استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك على{' '}
            <strong>{siteName}</strong>. اضغط على الزر أدناه لاختيار كلمة مرور
            جديدة. صلاحية هذا الرابط محدودة لأسباب أمنية.
          </Text>
          <Section style={{ textAlign: 'center' as const }}>
            <Button style={button} href={confirmationUrl}>
              إعادة تعيين كلمة المرور
            </Button>
          </Section>
          <Text style={smallText}>
            إذا لم يعمل الزر، انسخ الرابط التالي والصقه في المتصفح:
          </Text>
          <Text style={urlText}>{confirmationUrl}</Text>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>
          إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان،
          ولن يتم تغيير كلمة المرور الخاصة بك.
        </Text>
        <Text style={footerBrand}>
          © {new Date().getFullYear()} {siteName} — دار عبيد للنشر والتوزيع والطباعة
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
  padding: '24px 0',
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 20px' }
const header = { textAlign: 'center' as const, padding: '16px 0 24px' }
const brand = {
  fontSize: '24px',
  fontWeight: 800 as const,
  color: 'hsl(174, 72%, 46%)',
  letterSpacing: '2px',
  margin: 0,
}
const card = {
  backgroundColor: '#fafafa',
  border: '1px solid hsl(0, 0%, 90%)',
  borderRadius: '12px',
  padding: '28px 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 700 as const,
  color: 'hsl(0, 0%, 10%)',
  margin: '0 0 16px',
  textAlign: 'right' as const,
}
const text = {
  fontSize: '15px',
  color: 'hsl(0, 0%, 25%)',
  lineHeight: '1.7',
  margin: '0 0 24px',
  textAlign: 'right' as const,
}
const button = {
  backgroundColor: 'hsl(174, 72%, 46%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  borderRadius: '8px',
  padding: '14px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const smallText = {
  fontSize: '13px',
  color: 'hsl(0, 0%, 45%)',
  margin: '24px 0 8px',
  textAlign: 'right' as const,
}
const urlText = {
  fontSize: '12px',
  color: 'hsl(174, 72%, 40%)',
  wordBreak: 'break-all' as const,
  margin: 0,
  textAlign: 'right' as const,
}
const hr = { borderColor: 'hsl(0, 0%, 90%)', margin: '28px 0 16px' }
const footer = {
  fontSize: '12px',
  color: 'hsl(0, 0%, 45%)',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}
const footerBrand = {
  fontSize: '11px',
  color: 'hsl(0, 0%, 60%)',
  textAlign: 'center' as const,
  margin: 0,
}
