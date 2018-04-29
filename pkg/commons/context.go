package commons

import (
	"context"
	"time"
)

// GetCtx obtains a 30 seconds context
func GetCtx() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 30*time.Second)
}
