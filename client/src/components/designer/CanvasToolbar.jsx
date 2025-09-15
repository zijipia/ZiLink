"use client"
import { Grid, Minimize, Maximize, Eye } from "lucide-react"

const CanvasToolbar = ({ showGrid, onToggleGrid, canvasZoom, onZoomChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleGrid}
          className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
            showGrid
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Grid</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onZoomChange(Math.max(25, canvasZoom - 10))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Minimize className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">{canvasZoom}%</span>
          <button
            onClick={() => onZoomChange(Math.min(200, canvasZoom + 10))}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="flex items-center space-x-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Eye className="w-4 h-4" />
          <span>Preview</span>
        </button>
      </div>
    </div>
  )
}

export default CanvasToolbar
