// pages/MyBatches.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import clsx from "clsx";
import {
  LuDownload,
  LuLoaderCircle,
  LuCircleCheck,
  LuCircleX,
  LuCircleAlert,
  LuClock,
} from "react-icons/lu";
import { useAlert } from "@/context/AlertContext";
import { APP_BASE_URL } from "@/utils/env";

export default function MyBatches() {
  const { showAlert } = useAlert();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${APP_BASE_URL}/app/renders/batches`, {
        withCredentials: true,
      });
      setBatches(res.data);
    } catch (err) {
      showAlert("Failed to load batches", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (zipUrl, batchId) => {
    const link = document.createElement("a");
    link.href = zipUrl;
    link.download = `batch_${batchId}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("Download started", { type: "success" });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <LuCircleCheck className="h-5 w-5 text-emerald-600" />;
      case "processing":
        return <LuLoaderCircle className="h-5 w-5 text-blue-600 animate-spin" />;
      case "failed":
        return <LuCircleX className="h-5 w-5 text-red-600" />;
      case "partial":
        return <LuCircleAlert className="h-5 w-5 text-orange-600" />;
      default:
        return <LuClock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      processing: "bg-blue-50 text-blue-700 border-blue-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      partial: "bg-orange-50 text-orange-700 border-orange-200",
      pending: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
          styles[status] || styles.pending
        )}
      >
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LuLoaderCircle className="h-8 w-8 animate-spin text-[#FF6E61]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Batches</h1>
        <p className="mt-2 text-sm text-gray-600">
          View and download your batch generation jobs.
        </p>
      </div>

      {batches.length === 0 ? (
        <div className="rounded-2xl border  border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">
            No batches yet. Create your first batch from the CSV Batch page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div
              key={batch.batchId}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start border-gray-400 justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {batch.template_name}
                    </h3>
                    {getStatusBadge(batch.batchStatus)}
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-gray-500">Total Rows</p>
                      <p className="font-semibold text-gray-900">
                        {batch.batchTotalRows || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Completed</p>
                      <p className="font-semibold text-emerald-600">
                        {batch.batchCompletedRows || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Failed</p>
                      <p className="font-semibold text-red-600">
                        {batch.batchFailedRows || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Format</p>
                      <p className="font-semibold text-gray-900 uppercase">
                        {batch.format}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Created: {new Date(batch.created_at).toLocaleString()}
                  </div>

                  {batch.batchError && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                      Error: {batch.batchError}
                    </div>
                  )}
                </div>

                {batch.batchStatus === "completed" || batch.batchStatus === "partial" ? (
                  <button
                    onClick={() => handleDownload(batch.batchZipUrl, batch.batchId)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#FF6E61] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e75d51]"
                  >
                    <LuDownload className="h-4 w-4" />
                    Download ZIP
                  </button>
                ) : null}
              </div>

              {batch.batchStatus === "processing" && (
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#FF6E61] transition-all animate-pulse"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Processing... This may take a few minutes
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}