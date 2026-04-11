import React, { useEffect, useState } from 'react';
import { Header, Page } from './Header';
import { DashboardPage } from './pages/DashboardPage';
import { BattingSummaryPage } from './pages/BattingSummaryPage';
import { PlayerListPage } from './pages/PlayerListPage';
import { BowlingSummaryPage } from './pages/BowlingSummaryPage';
import { BattingHistoryPage } from './pages/BattingHistoryPage';
import { BowlingHistoryPage } from './pages/BowlingHistoryPage';
import { TeamStatsPage } from './pages/TeamStatsPage';

const VERSION_POLL_MS = 5 * 60 * 1000;
const LAST_SEEN_BUILD_KEY = 'texas-thanos:last-seen-build';

interface VersionMetadata {
	appVersion: string;
	buildId: string;
	commitSha: string;
	buildTimeUtc: string;
	message?: string;
}

const PAGE_ROUTES: Record<Page, string> = {
	'dashboard': 'dashboard',
	'team-stats': 'team-stats',
	'batting-summary': 'batting-summary',
	'player-list': 'player-list',
	'bowling-summary': 'bowling-summary',
	'batting-history': 'batting-history',
	'bowling-history': 'bowling-history',
};

const isPage = (value: string): value is Page => {
	return value in PAGE_MAP;
};

const getPageFromHash = (): Page => {
	if (typeof window === 'undefined') {
		return 'dashboard';
	}

	const normalized = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
	if (isPage(normalized)) {
		return normalized;
	}

	return 'dashboard';
};

const PAGE_MAP: Record<Page, React.FC> = {
	'dashboard': DashboardPage,
	'team-stats': TeamStatsPage,
	'batting-summary': BattingSummaryPage,
	'bowling-summary': BowlingSummaryPage,
	'batting-history': BattingHistoryPage,
	'bowling-history': BowlingHistoryPage,
    'player-list': PlayerListPage,
};

export const App: React.FC = () => {
	const [activePage, setActivePage] = useState<Page>(getPageFromHash);
	const [knownBuildId, setKnownBuildId] = useState<string | null>(() => {
		if (typeof window === 'undefined') {
			return null;
		}

		return window.localStorage.getItem(LAST_SEEN_BUILD_KEY);
	});
	const [availableUpdate, setAvailableUpdate] = useState<VersionMetadata | null>(null);

	const parseVersionMetadata = (value: unknown): VersionMetadata | null => {
		if (!value || typeof value !== 'object') {
			return null;
		}

		const data = value as Record<string, unknown>;
		if (typeof data.buildId !== 'string' || typeof data.appVersion !== 'string') {
			return null;
		}

		return {
			appVersion: data.appVersion,
			buildId: data.buildId,
			commitSha: typeof data.commitSha === 'string' ? data.commitSha : 'unknown',
			buildTimeUtc: typeof data.buildTimeUtc === 'string' ? data.buildTimeUtc : '',
			message: typeof data.message === 'string' ? data.message : undefined,
		};
	};

	const persistKnownBuildId = (buildId: string) => {
		setKnownBuildId(buildId);
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(LAST_SEEN_BUILD_KEY, buildId);
		}
	};

	const isLocalBrowserMode = (): boolean => {
		if (typeof window === 'undefined') {
			return false;
		}

		const host = window.location.hostname;
		const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
		return isLocalHost && window.location.pathname.endsWith('/browser.html');
	};

	const checkForVersionUpdate = async () => {
		if (isLocalBrowserMode()) {
			return;
		}

		try {
			const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
			if (!response.ok) {
				return;
			}

			const json = await response.json();
			const metadata = parseVersionMetadata(json);
			if (!metadata) {
				return;
			}

			if (!knownBuildId) {
				persistKnownBuildId(metadata.buildId);
				return;
			}

			if (knownBuildId !== metadata.buildId) {
				setAvailableUpdate(metadata);
			}
		} catch {
			// Ignore polling failures and retry on next interval.
		}
	};

	useEffect(() => {
		const onHashChange = () => {
			setActivePage(getPageFromHash());
		};

		window.addEventListener('hashchange', onHashChange);

		if (!window.location.hash) {
			window.location.hash = `/${PAGE_ROUTES.dashboard}`;
		}

		return () => {
			window.removeEventListener('hashchange', onHashChange);
		};
	}, []);

	useEffect(() => {
		void checkForVersionUpdate();

		const intervalId = window.setInterval(() => {
			void checkForVersionUpdate();
		}, VERSION_POLL_MS);

		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void checkForVersionUpdate();
			}
		};

		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			window.clearInterval(intervalId);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [knownBuildId]);

	const handleNavigate = (page: Page) => {
		setActivePage(page);
		window.location.hash = `/${PAGE_ROUTES[page]}`;
	};

	const PageComponent = PAGE_MAP[activePage];

	return (
		<div className="app">
			{availableUpdate && (
				<div className="update-banner" role="status" aria-live="polite">
					<div className="update-banner__body">
						<strong className="update-banner__title">New version available</strong>
						<span className="update-banner__text">
							{availableUpdate.message ?? `Version ${availableUpdate.appVersion} is now available.`}
						</span>
					</div>
					<div className="update-banner__actions">
						<button
							type="button"
							className="update-banner__btn"
							onClick={() => {
								persistKnownBuildId(availableUpdate.buildId);
								window.location.reload();
							}}
						>
							Refresh
						</button>
						<button
							type="button"
							className="update-banner__btn update-banner__btn--ghost"
							onClick={() => {
								persistKnownBuildId(availableUpdate.buildId);
								setAvailableUpdate(null);
							}}
						>
							Dismiss
						</button>
					</div>
				</div>
			)}
			<Header activePage={activePage} onNavigate={handleNavigate} />
			<main className="app-content">
				<PageComponent />
			</main>
		</div>
	);
};