import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <main className="page-main content-container flex items-center justify-center">
      <EmptyState
        icon="search"
        title="Page not found"
        description="The page you're looking for doesn't exist, or the restaurant may have been removed."
        className="w-full"
      >
        <ButtonLink href="/" variant="primary" size="md">
          Back to home
        </ButtonLink>
        <ButtonLink href="/restaurants" variant="outline" size="md">
          Browse restaurants
        </ButtonLink>
      </EmptyState>
    </main>
  );
}
