package deploy

import (
	"context"
	"fmt"

	"github.com/ViBiOh/auth/pkg/model"
)

const (
	never   = "never"
	onError = "onError"
	all     = "all"
)

func (a *App) sendEmailNotification(ctx context.Context, user *model.User, appName string, services map[string]*deployedService, success bool) error {
	if a.notification == never || (success && a.notification == onError) {
		return nil
	}

	notificationContent := deployNotification{
		Success: success,
		App:     appName,
		URL:     a.appURL,
	}

	notificationContent.Services = make([]deployedService, 0)
	for _, service := range services {
		notificationContent.Services = append(notificationContent.Services, *service)
	}

	recipients := []string{user.Email}

	if err := a.mailerApp.SendEmail(ctx, "dashboard", "dashboard@vibioh.fr", "Dashboard", fmt.Sprintf("[dashboard] Deploy of %s", appName), recipients, notificationContent); err != nil {
		return err
	}

	return nil
}
