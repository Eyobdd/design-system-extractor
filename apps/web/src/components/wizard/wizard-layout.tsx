'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { WizardSidebar } from './wizard-sidebar';
import { WizardFooter } from './wizard-footer';
import { StepContent } from './step-content';
import { ConfirmationModal } from './confirmation-modal';
import { useWizard } from '@/hooks/use-wizard';

export function WizardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { resetWizard } = useWizard();

  const handleConfirmReset = () => {
    setShowResetModal(false);
    resetWizard();
  };

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile menu button - only visible on mobile */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg p-2 md:hidden"
        style={{ color: 'var(--muted)' }}
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        <div
          className={`${
            isMobileMenuOpen ? 'block' : 'hidden'
          } fixed inset-0 z-40 bg-black/30 md:hidden`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-50 w-[200px] transform transition-transform md:relative md:translate-x-0`}
          style={{ backgroundColor: 'var(--background)' }}
        >
          <WizardSidebar onRequestReset={() => setShowResetModal(true)} />
        </div>

        {/* Vertical divider - subtle, centered */}
        <div className="hidden md:flex items-center">
          <div className="divider-vertical" />
        </div>

        {/* Main content area */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto px-12 py-10">
            <StepContent />
          </div>

          {/* Horizontal divider before footer */}
          <div className="divider-centered my-0" />

          <WizardFooter onRequestReset={() => setShowResetModal(true)} />
        </main>
      </div>

      {/* Fullscreen Reset Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Start Over?"
        message="Going back to Extract will clear all your progress including tokens and variants you've defined."
        confirmLabel="Start Over"
        cancelLabel="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
        variant="warning"
      />
    </div>
  );
}
