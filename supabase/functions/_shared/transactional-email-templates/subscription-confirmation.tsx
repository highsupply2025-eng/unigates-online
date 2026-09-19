import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  planLabel?: string
}

const SubscriptionConfirmationEmail = ({ name, planLabel }: Props) => (
  <Html lang="ar" dir="rtl">
    <Head />
    <Preview>تم تفعيل اشتراكك على منصة UNIGATES</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>تم تفعيل اشتراكك</Heading>
        <Text style={text}>مرحبًا {name && name.trim() ? name : ''}،</Text>
        <Text style={text}>
          تم تأكيد الدفع وتفعيل خطتك {planLabel ?? 'الشهرية'} على منصة UNIGATES.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionConfirmationEmail,
  subject: 'تأكيد الاشتراك — UNIGATES',
  displayName: 'تأكيد الاشتراك',
  previewData: { name: 'محمد أحمد', planLabel: 'السنوية' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Cairo, Arial, sans-serif',
}
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
