import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface AppInfo {
	development_mode: boolean;
	config_dir: string;
	data_dir: string;
	database_path: string;
}

export const useAppInfo = () => {
	const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadAppInfo = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const info = await invoke<AppInfo>("get_app_info");
			setAppInfo(info);
		} catch (err) {
			console.error("Failed to load app info:", err);
			setError(`Failed to load app info: ${err}`);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadAppInfo();
	}, [loadAppInfo]);

	return {
		appInfo,
		loading,
		error,
		reload: loadAppInfo,
	};
};
