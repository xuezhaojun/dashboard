package client

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateKubernetesClient(t *testing.T) {
	tests := []struct {
		name        string
		debugMode   bool
		useMock     string
		expectNil   bool
	}{
		{
			name:        "mock mode enabled",
			debugMode:   true,
			useMock:     "true",
			expectNil:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Setenv("DASHBOARD_USE_MOCK", tt.useMock)
			defer os.Unsetenv("DASHBOARD_USE_MOCK")

			client := CreateKubernetesClient(tt.debugMode)
			if tt.expectNil {
				assert.Nil(t, client)
			} else {
				assert.NotNil(t, client)
			}
		})
	}
}

func TestCreateKubernetesClientMockMode(t *testing.T) {
	os.Setenv("DASHBOARD_USE_MOCK", "true")
	defer os.Unsetenv("DASHBOARD_USE_MOCK")

	client := CreateKubernetesClient(false)
	assert.Nil(t, client, "Client should be nil in mock mode")
}
