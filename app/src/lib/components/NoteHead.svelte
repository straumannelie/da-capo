<script lang="ts">
	let { color, filled }: { color: string; filled: boolean } = $props();
</script>

<span class="note" class:filled style:--note-color={color} aria-hidden="true"></span>

<style>
	.note {
		display: inline-block;
		flex: none;
		width: 16px;
		height: 12px;
		border: 2px solid var(--note-color);
		border-radius: 50%;
		transform: rotate(-22deg);
	}

	.filled {
		background: var(--note-color);
	}
</style>
