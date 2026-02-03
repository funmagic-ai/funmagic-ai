'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Mail, MessageCircle, FileText } from 'lucide-react'

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@funmagic.ai'

export default function HelpPage() {
  const t = useTranslations('help')

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
  ]

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card p-6 rounded-xl shadow-sm border text-center">
          <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('cards.docs.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('cards.docs.description')}</p>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border text-center">
          <div className="inline-flex p-3 bg-green-100 dark:bg-green-950 rounded-full mb-4">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('cards.community.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('cards.community.description')}</p>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-sm border text-center">
          <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-950 rounded-full mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('cards.support.title')}</h3>
          <p className="text-muted-foreground text-sm">{t('cards.support.description')}</p>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{t('faqTitle')}</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>

      <div className="bg-muted rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">{t('contact.title')}</h2>
        <p className="text-muted-foreground mb-6">{t('contact.description')}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Mail className="w-5 h-5" />
          {t('contact.button')}
        </a>
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent transition-colors"
      >
        <span className="font-medium text-foreground">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-muted-foreground">{answer}</p>
        </div>
      )}
    </div>
  )
}
