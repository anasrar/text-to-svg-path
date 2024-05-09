<script lang="ts">
	import { afterUpdate, onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import {
		CheckIcon,
		ClipboardIcon,
		DownloadIcon,
		SettingsIcon,
	} from "lucide-svelte";
	import opentype from "opentype.js";
	import { mergePathCommands } from "$lib/path";

	const fontSizePreset = [18, 24, 36, 48, 72] as const;

	let font: null | opentype.Font = null;
	let viewBox: [number, number] = [0, 0];
	let paths: null | { char: string; d: string }[] = null;

	let text = "Hi mom";
	let fontSize = 72;

	let background = false;
	let backgroundColor = "#ffffff";
	let boundaries = true;
	let boundariesColor = "#fb923c";

	let padding = false;
	let paddingWidth = 2;
	let fill = true;
	let fillColor = "#ffffff";
	let stroke = false;
	let strokeColor = "#ffffff";
	let strokeWidth = 1.5;
	let combinePath = false;
	let debugSymbol = false;

	let copied = false;

	function updatePaths(
		font: opentype.Font | null,
		text: string,
		fontSize: number,
		combinePath: boolean,
		paddingWidth: number,
	) {
		if (font === null) {
			return;
		}

		const p = Number(paddingWidth);
		const typePath = font.getPath(text, 0, 0, fontSize);
		const { y1 } = typePath.getBoundingBox();

		if (combinePath) {
			const typePath = font.getPath(text, p, y1 * -1 + p, fontSize);
			paths = [{ char: "", d: mergePathCommands(typePath.commands) }];
		} else {
			const typePaths = font.getPaths(text, p, y1 * -1 + p, fontSize);
			const tmpPaths: typeof paths = [];
			for (let i = 0; i < typePaths.length; i++) {
				const path = typePaths[i];
				const char = text.charAt(i);
				if (path.commands.length !== 0) {
					tmpPaths.push({
						char,
						d: mergePathCommands(path.commands),
					});
				}
			}
			paths = tmpPaths;
		}
	}

	$: updatePaths(
		font,
		text,
		fontSize,
		combinePath,
		padding ? paddingWidth : 0,
	);

	onMount(() => {
		(async () => {
			const res = await fetch("./SpecialGothic-ExtendedBold.ttf");
			font = opentype.parse(await res.arrayBuffer());
		})();
	});

	afterUpdate(() => {
		const g = document.querySelector("svg")?.querySelector("g");
		if (g) {
			const { x, y, width, height } = g.getBBox();
			const p = padding ? Number(paddingWidth) : 0;
			viewBox = [x + width + p * 2, y + height + p * 2];
		}
	});

	async function copySvg() {
		const svg = document.querySelector("svg")!;
		await navigator.clipboard.writeText(svg.outerHTML);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1000);
	}

	async function downloadSvg() {
		const svg = document.querySelector("svg")!;
		const data = `data:image/svg+xml;charset=utf-8, ${encodeURIComponent(
			svg.outerHTML,
		)}`;

		const anchor = document.createElement("a");
		anchor.setAttribute("href", data);
		anchor.setAttribute("download", `${text}.svg`);
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
	}
</script>

<main class="flex flex-col justify-end items-center">
	<div class="flex-grow flex flex-col w-screen overflow-auto">
		{#if paths}
			<div
				class="self-start"
				style={`background:${background ? backgroundColor : "none"}; border: ${boundaries ? `2px dashed ${boundariesColor}` : "none"}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox={`0 0 ${viewBox[0]} ${viewBox[1]}`}
					width={viewBox[0]}
					height={viewBox[1]}
				>
					<g
						fill={fill ? fillColor : "none"}
						stroke-width={strokeWidth}
						stroke={stroke ? strokeColor : "none"}
					>
						{#each paths as path}
							{#if debugSymbol}
								<path data-char={path.char} d={path.d} />
							{:else}
								<path d={path.d} />
							{/if}
						{/each}
					</g>
				</svg>
			</div>
		{:else}
			<div class="flex-grow flex flex-col justify-center items-center">
				Loading Default Font
			</div>
		{/if}
	</div>
	<div class="flex flex-col gap-2 p-3 w-full max-w-lg">
		<div class="flex flex-row justify-center gap-2">
			<Button
				size={"sm"}
				variant={"secondary"}
				on:click={copySvg}
				disabled={copied}
			>
				{#if copied}
					<CheckIcon class="mr-2 h-4 w-4" />
				{:else}
					<ClipboardIcon class="mr-2 h-4 w-4" />
				{/if}
				Copy SVG
			</Button>
			<Button size={"sm"} variant={"secondary"} on:click={downloadSvg}>
				<DownloadIcon class="mr-2 h-4 w-4" />
				Download SVG
			</Button>
		</div>
		<div>
			<Input
				type="file"
				accept="font/woff, font/otf, font/ttf"
				on:change={async (event) => {
					const files = event.currentTarget.files;
					if (files !== null) {
						const file = files[0];
						font = opentype.parse(await file.arrayBuffer());
					}
				}}
			/>
		</div>
		<div>
			<Input type={"text"} bind:value={text} />
		</div>
		<div class="flex flex-row justify-between">
			<Popover.Root>
				<Popover.Trigger>
					<Button variant={"outline"} class={"tabular-nums"}>
						{fontSize}
					</Button>
				</Popover.Trigger>
				<Popover.Content align={"start"}>
					<div class="flex flex-col gap-4">
						<Input
							bind:value={fontSize}
							type={"number"}
							pattern={"[0-9]+"}
							min={1}
							step={1}
						/>
						<div class="flex flex-row gap-2">
							{#each fontSizePreset as fs}
								<Button
									class="flex-grow"
									variant={"secondary"}
									size={"sm"}
									on:click={() => {
										fontSize = fs;
									}}
								>
									{fs}
								</Button>
							{/each}
						</div>
					</div>
				</Popover.Content>
			</Popover.Root>
			<div class="flex flex-row gap-2">
				<Popover.Root>
					<Popover.Trigger>
						<Button variant={"outline"} size={"sm"}>
							<SettingsIcon class="mr-2 h-4 w-4" />
							Preview
						</Button>
					</Popover.Trigger>
					<Popover.Content align={"end"}>
						<div class="flex flex-col gap-2">
							<div class="flex items-start gap-2">
								<Checkbox id="fill" bind:checked={background} />
								<div class="flex flex-col gap-2">
									<Label
										for="fill"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Background
									</Label>
									<Input
										bind:value={backgroundColor}
										disabled={!background}
										type={"color"}
										min={0}
										step={1}
										class="w-12"
									/>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<Checkbox id="fill" bind:checked={boundaries} />
								<div class="flex flex-col gap-2">
									<Label
										for="fill"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Boundaries
									</Label>
									<Input
										bind:value={boundariesColor}
										disabled={!boundaries}
										type={"color"}
										min={0}
										step={1}
										class="w-12"
									/>
								</div>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
				<Popover.Root>
					<Popover.Trigger>
						<Button variant={"outline"} size={"sm"}>
							<SettingsIcon class="mr-2 h-4 w-4" />
							SVG
						</Button>
					</Popover.Trigger>
					<Popover.Content align={"end"}>
						<div class="flex flex-col gap-2">
							<div class="flex items-start gap-2">
								<Checkbox id="padding" bind:checked={padding} />
								<div class="flex flex-col gap-2">
									<Label
										for="padding"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Padding
									</Label>
									<Input
										bind:value={paddingWidth}
										disabled={!padding}
										type={"number"}
										min={0}
										step={1}
									/>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<Checkbox id="fill" bind:checked={fill} />
								<div class="flex flex-col gap-2">
									<Label
										for="fill"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Fill
									</Label>
									<Input
										bind:value={fillColor}
										disabled={!fill}
										type={"color"}
										min={0}
										step={1}
										class="w-12"
									/>
								</div>
							</div>
							<div class="flex items-start gap-2">
								<Checkbox id="stroke" bind:checked={stroke} />
								<div class="flex flex-col gap-2">
									<Label
										for="stroke"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Stroke
									</Label>
									<Input
										bind:value={strokeWidth}
										disabled={!stroke}
										type={"number"}
										min={0}
										step={1}
									/>
									<Input
										bind:value={strokeColor}
										disabled={!stroke}
										type={"color"}
										min={0}
										step={1}
										class="w-12"
									/>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Checkbox
									id="combine-path"
									bind:checked={combinePath}
								/>
								<Label
									for="combine-path"
									class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Combine path
								</Label>
							</div>
							<div class="flex items-center gap-2">
								<Checkbox
									id="debug-symbol"
									bind:checked={debugSymbol}
								/>
								<Label
									for="debug-symbol"
									class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									Debug symbol
								</Label>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
			</div>
		</div>
	</div>
</main>

<style>
	main {
		min-height: 100vh;
		min-height: 100dvh;
	}

	/* Chrome, Safari, Edge, Opera */
	:global(
			input::-webkit-outer-spin-button,
			input::-webkit-inner-spin-button
		) {
		-webkit-appearance: none;
		margin: 0;
	}

	/* Firefox */
	:global(input[type="number"]) {
		-moz-appearance: textfield;
	}
</style>
