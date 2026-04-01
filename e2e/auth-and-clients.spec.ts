import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function register(page: Page, email: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();

  await page.getByLabel('Nome').fill('Kamila Alves');
  await page.getByLabel('E-mail').fill(email);
  await page.getByPlaceholder('Crie uma senha:').fill('senha123');
  await page.getByLabel('Confirmar senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

async function openRegister(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
}

async function createClient(page: Page, clientName: string) {
  await page.getByRole('button', { name: 'Criar cliente' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Criar cliente:' });
  await createDialog.getByLabel('Nome').fill(clientName);
  await createDialog.getByLabel('Salário').fill('350000');
  await createDialog.getByLabel('Valor da empresa').fill('12000000');
  await createDialog.getByRole('button', { name: 'Criar cliente' }).click();
  await expect(page.getByRole('status')).toContainText('Cliente criado com sucesso');
}

test('cadastro, criacao, selecao e exclusao de cliente', async ({ page }) => {
  const runId = Date.now();
  const email = `e2e.${runId}@test.local`;
  const clientName = `Cliente E2E ${runId}`;
  const topNav = page.locator('.top-nav');

  await register(page, email);

  await topNav.getByRole('button', { name: 'Clientes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Criar cliente' })).toBeVisible();

  await createClient(page, clientName);

  const clientCard = page.locator('.client-card', { hasText: clientName }).first();
  await expect(clientCard).toBeVisible();

  await clientCard.getByRole('button', { name: 'Selecionar cliente' }).click();
  await expect(page.getByRole('status')).toContainText('foi selecionado com sucesso');

  await topNav.getByRole('button', { name: 'Clientes selecionados', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Clientes selecionados:' })).toBeVisible();
  await expect(page.locator('.client-card', { hasText: clientName })).toBeVisible();

  await page
    .locator('.client-card', { hasText: clientName })
    .getByRole('button', { name: 'Remover seleção' })
    .click();
  await expect(page.getByText('Nenhum cliente selecionado.')).toBeVisible();

  await topNav.getByRole('button', { name: 'Clientes', exact: true }).click();
  const clientCardBackOnList = page.locator('.client-card', { hasText: clientName }).first();
  await clientCardBackOnList.getByRole('button', { name: 'Excluir cliente' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Excluir cliente:' });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole('button', { name: 'Excluir cliente' }).click();

  await expect(page.getByRole('status')).toContainText('Cliente excluído com sucesso');
  await expect(page.locator('.client-card', { hasText: clientName })).toHaveCount(0);
});

test('login invalido exibe erro para o usuario', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('E-mail').fill('usuario-inexistente@test.local');
  await page.getByLabel('Senha').fill('senha-invalida');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');
});

test('cadastro com e-mail duplicado exibe erro e nao autentica o usuario', async ({ page }) => {
  const runId = Date.now();
  const email = `e2e.duplicate.${runId}@test.local`;

  await register(page, email);
  await page.locator('.top-nav').getByRole('button', { name: 'Sair', exact: true }).click();

  await openRegister(page);
  await page.getByLabel('Nome').fill('Kamila Alves');
  await page.getByLabel('E-mail').fill(email);
  await page.getByPlaceholder('Crie uma senha:').fill('senha123');
  await page.getByLabel('Confirmar senha').fill('senha123');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'Este e-mail já está cadastrado. Tente fazer login.',
  );
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
});

test('edita um cliente existente e persiste o novo nome na lista', async ({ page }) => {
  const runId = Date.now();
  const email = `e2e.edit.${runId}@test.local`;
  const clientName = `Cliente E2E ${runId}`;
  const updatedClientName = `Cliente Editado ${runId}`;
  const topNav = page.locator('.top-nav');

  await register(page, email);
  await topNav.getByRole('button', { name: 'Clientes', exact: true }).click();
  await createClient(page, clientName);

  const clientCard = page.locator('.client-card', { hasText: clientName }).first();
  await clientCard.getByRole('button', { name: 'Editar cliente' }).click();

  const editDialog = page.getByRole('dialog', { name: 'Editar cliente:' }).first();
  await editDialog.getByLabel('Nome').fill(updatedClientName);
  await editDialog.getByLabel('Salário').fill('410000');
  await editDialog.getByLabel('Valor da empresa').fill('13000000');
  await editDialog.getByRole('button', { name: 'Editar cliente' }).click();

  const confirmDialog = page.getByRole('dialog', { name: 'Editar cliente:' }).last();
  await confirmDialog.getByRole('button', { name: 'Confirmar edição' }).click();

  await expect(page.getByRole('status')).toContainText('Cliente atualizado com sucesso');
  await expect(page.locator('.client-card', { hasText: updatedClientName })).toBeVisible();

  const updatedCard = page.locator('.client-card', { hasText: updatedClientName }).first();
  await updatedCard.getByRole('button', { name: 'Excluir cliente' }).click();
  const deleteDialog = page.getByRole('dialog', { name: 'Excluir cliente:' });
  await deleteDialog.getByRole('button', { name: 'Excluir cliente' }).click();
  await expect(page.locator('.client-card', { hasText: updatedClientName })).toHaveCount(0);
});

test('logout limpa a sessao e volta para a tela inicial', async ({ page }) => {
  const runId = Date.now();
  const email = `e2e.logout.${runId}@test.local`;
  const topNav = page.locator('.top-nav');

  await register(page, email);
  await topNav.getByRole('button', { name: 'Sair', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeVisible();

  await page.goto('/clients');
  await expect(page.getByRole('heading', { name: 'Olá, seja bem-vindo!' })).toBeVisible();
});
