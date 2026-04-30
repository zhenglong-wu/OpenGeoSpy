.PHONY: dev api frontend stop lint lint-fe lint-be

dev:
	@bash -c 'trap "kill 0" SIGINT SIGTERM EXIT; \
		ML__DEVICE=mps uv run uvicorn src.api.app:app --host 0.0.0.0 --port 8000 & \
		(cd fe && npm install && npm run dev) & \
		wait'

api:
	ML__DEVICE=mps uv run uvicorn src.api.app:app --host 0.0.0.0 --port 8000

frontend:
	cd fe && npm install && npm run dev

stop:
	@-lsof -ti :8000 | xargs kill 2>/dev/null
	@-lsof -ti :5173 | xargs kill 2>/dev/null
	@echo "Stopped"

lint: lint-fe lint-be

lint-fe:
	cd fe && npx tsc -b --noEmit

lint-be:
	uv run ruff check .
	uv run basedpyright src
