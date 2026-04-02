<script setup lang="ts">
</script>

<template>
</template>

<style lang="scss" scoped>
.title-side {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.8em;
	font-weight: 400;
	color: var(--c-text-2);

	small {
		line-height: 1;
	}
}

.refresh-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.15rem;
	height: 1.15rem;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: transparent;
	color: var(--c-text-2);
	cursor: pointer;
	transition: color 0.2s, background-color 0.2s;

	&:hover:not(:disabled) {
		color: var(--c-primary);
		background-color: var(--c-bg-soft);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.spinning {
	animation: spin 0.8s linear infinite;
}

.app-entry {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
}

.app-icon {
	font-size: 0.95em;
	color: var(--c-primary);
}

.tip {
	font-size: 0.92em;
	color: var(--c-text-2);
}

.status-list {
	display: grid;
	gap: 0.5rem;

	> div {
		display: grid;
		grid-template-columns: 2.4rem 1fr;
		gap: 0.45rem;
		align-items: baseline;
		min-width: 0;
	}

	dt {
		font-size: 0.84em;
		color: var(--c-text-2);
	}

	dd {
		margin: 0;
		font-size: 0.92em;
		line-height: 1.35;
		color: var(--c-text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.online {
	color: var(--c-success);
	font-weight: 600;
}

.offline {
	color: var(--c-text-2);
}
</style>
