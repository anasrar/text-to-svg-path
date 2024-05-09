import opentype from "opentype.js";

export function mergePathCommands(commands: opentype.PathCommand[]) {
	return commands.reduce((previousValue, command, i) => {
		let result = "";
		switch (command.type) {
			case "M":
				result = `M ${command.x} ${command.y}`;
				break;
			case "L":
				result = `L ${command.x} ${command.y}`;
				break;
			case "C":
				result = `C ${command.x1} ${command.y1} ${command.x2} ${command.y2} ${command.x} ${command.y}`;
				break;
			case "Q":
				result = `Q ${command.x1} ${command.y1} ${command.x} ${command.y}`;
				break;
			case "Z":
				result = "Z";
				break;
		}
		return i === 0 ? result : `${previousValue} ${result}`;
	}, "");
}
