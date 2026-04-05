import React from "react"
import { AnalystDashboard } from "./_components/analyst-dashboard"

export const metadata = {
	title: "Analyst Dashboard | Finance Management",
	description: "System-wide read-only financial analytics for analyst role",
}

export default function AnalystWorkspacePage() {
	return (
		<main className="p-8">
			<div className="mx-auto max-w-7xl space-y-6">
				<header className="space-y-2">
					<h1 className="text-3xl font-bold tracking-tight ">Analyst Dashboard</h1>
					<p className="text-sm text-zinc-400">System-wide financial insights. Read-only analytics across all users.</p>
				</header>

				<AnalystDashboard />
			</div>
		</main>
	)
}
