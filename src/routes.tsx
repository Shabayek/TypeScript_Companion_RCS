import { Route, Routes } from 'react-router-dom';
import { AppShell } from './app/App';
import { HomePage } from './features/home/HomePage';
import { LessonPage } from './features/lesson/LessonPage';
import { ModulePage } from './features/journey/ModulePage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { PlaygroundPage } from './features/playground/PlaygroundPage';
import { ProgressPage } from './features/progress/ProgressPage';
import { ReviewPage } from './features/review/ReviewPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { GlossaryPage } from './features/reference/GlossaryPage';
import { CheatsheetPage } from './features/reference/CheatsheetPage';
import { DecoderPage } from './features/reference/DecoderPage';
import { AboutPage } from './features/reference/AboutPage';
import { ArenaPage, ArenaPuzzlePage } from './features/arena/ArenaPage';
import { EmptyState } from './ui/primitives';
import { LinkButton } from './ui/Button';
import { useT } from './i18n/t';

function NotFound() {
  const { t } = useT();
  return (
    <EmptyState
      title={t('shell.notFoundTitle')}
      action={
        <LinkButton to="/" variant="primary">
          {t('shell.backToJourney')}
        </LinkButton>
      }
    >
      {t('shell.notFoundBody')}
    </EmptyState>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/learn/:lessonId" element={<LessonPage />} />
        <Route path="/module/:moduleId" element={<ModulePage />} />
        <Route path="/practice" element={<ReviewPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/cheatsheet" element={<CheatsheetPage />} />
        <Route path="/decoder" element={<DecoderPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/arena" element={<ArenaPage />} />
        <Route path="/arena/:puzzleId" element={<ArenaPuzzlePage />} />
        <Route
          path="*"
          element={<NotFound />}
        />
      </Route>
    </Routes>
  );
}
